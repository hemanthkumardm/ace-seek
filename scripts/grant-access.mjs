#!/usr/bin/env node

/**
 * CLI Tool to grant Max, Pro, Team, or Interview Masterclass to any user.
 * Usage:
 *   node scripts/grant-access.mjs <email-or-userId> [plan] [--masterclass]
 * Examples:
 *   node scripts/grant-access.mjs suprithm1@gmail.com max --masterclass
 *   node scripts/grant-access.mjs user_3JfqZJJVWEeipSkbJpeTfC07sHQ team --masterclass
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const envLocalPath = path.join(rootDir, "web", ".env.local");

function loadEnv() {
  const env = { ...process.env };
  if (fs.existsSync(envLocalPath)) {
    const lines = fs.readFileSync(envLocalPath, "utf8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim();
        env[key] = val;
      }
    }
  }
  return env;
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.log(`
Usage:
  node scripts/grant-access.mjs <email-or-userId> [plan] [--masterclass]

Plans:
  free | pro | max | team  (default: max)

Flags:
  --masterclass   Unlock 280+ Staff/Principal Interview Questions
  --no-masterclass Keep masterclass unlocked state unchanged or disabled

Examples:
  node scripts/grant-access.mjs user@gmail.com max --masterclass
  node scripts/grant-access.mjs user@example.com team
    `);
    process.exit(1);
  }

  const target = args[0].trim();
  let plan = "max";
  let hasMasterclass = false;

  for (const arg of args.slice(1)) {
    if (arg === "--masterclass") {
      hasMasterclass = true;
    } else if (arg === "--no-masterclass") {
      hasMasterclass = false;
    } else if (["free", "pro", "max", "team"].includes(arg.toLowerCase())) {
      plan = arg.toLowerCase();
    }
  }

  // If plan is max and no explicit masterclass flag was specified, default masterclass to true
  if (plan === "max" && !args.includes("--no-masterclass")) {
    hasMasterclass = true;
  }

  const env = loadEnv();
  const secretKey = env.CLERK_SECRET_KEY;
  if (!secretKey) {
    console.error("Error: CLERK_SECRET_KEY not found in web/.env.local or environment.");
    process.exit(1);
  }

  console.log(`\n🔍 Searching for user: "${target}" in Clerk...`);

  // 1. Fetch user by email or by user ID
  let user = null;
  if (target.startsWith("user_")) {
    const res = await fetch(`https://api.clerk.com/v1/users/${target}`, {
      headers: { Authorization: `Bearer ${secretKey}` },
    });
    if (res.ok) {
      user = await res.json();
    }
  }

  if (!user) {
    // Search by email
    const res = await fetch(`https://api.clerk.com/v1/users?email_address=${encodeURIComponent(target)}`, {
      headers: { Authorization: `Bearer ${secretKey}` },
    });
    if (res.ok) {
      const list = await res.json();
      if (Array.isArray(list) && list.length > 0) {
        user = list[0];
      }
    }
  }

  if (!user) {
    // Try list and find
    const res = await fetch(`https://api.clerk.com/v1/users?limit=100`, {
      headers: { Authorization: `Bearer ${secretKey}` },
    });
    if (res.ok) {
      const list = await res.json();
      if (Array.isArray(list)) {
        user = list.find((u) =>
          u.email_addresses?.some((e) => e.email_address?.toLowerCase() === target.toLowerCase()) ||
          u.id === target
        );
      }
    }
  }

  if (!user) {
    console.error(`❌ User "${target}" not found in Clerk. Please ensure they have registered/signed in first.`);
    process.exit(1);
  }

  const email = user.email_addresses?.[0]?.email_address || "no-email";
  console.log(`✅ Found user:`);
  console.log(`   ID:    ${user.id}`);
  console.log(`   Email: ${email}`);
  console.log(`   Name:  ${[user.first_name, user.last_name].filter(Boolean).join(" ") || "N/A"}`);
  console.log(`   Current Plan: ${user.public_metadata?.plan || "free"}`);
  console.log(`   Current Masterclass: ${Boolean(user.public_metadata?.hasInterviewMasterclass)}`);

  console.log(`\n🚀 Updating entitlements...`);
  console.log(`   Target Plan:        ${plan}`);
  console.log(`   Masterclass Access: ${hasMasterclass}`);

  const nextMetadata = {
    ...(user.public_metadata || {}),
    plan,
    planStatus: plan === "free" ? "active" : "active",
    planPeriod: plan === "free" ? "none" : "monthly",
    hasInterviewMasterclass: hasMasterclass,
  };

  const updateRes = await fetch(`https://api.clerk.com/v1/users/${user.id}/metadata`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      public_metadata: nextMetadata,
    }),
  });

  if (!updateRes.ok) {
    const errText = await updateRes.text();
    console.error(`❌ Failed to update user metadata in Clerk:`, errText);
    process.exit(1);
  }

  const updatedUser = await updateRes.json();
  console.log(`\n🎉 Success! User updated.`);
  console.log(`   User: ${email} (${user.id})`);
  console.log(`   Plan: ${updatedUser.public_metadata?.plan}`);
  console.log(`   Interview Masterclass: ${updatedUser.public_metadata?.hasInterviewMasterclass}`);
  console.log(`\nThe user can now refresh their page or dashboard to see their unlocked Max + Masterclass privileges immediately! 🚀\n`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
