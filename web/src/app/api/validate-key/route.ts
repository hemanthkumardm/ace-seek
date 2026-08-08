import { NextRequest, NextResponse } from "next/server";
import { findUserByApiKey } from "@/lib/user-store";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { apiKey } = body;

    if (!apiKey) {
      return NextResponse.json({ valid: false, error: "API Key is required" }, { status: 400 });
    }

    const user = findUserByApiKey(apiKey);
    if (!user) {
      return NextResponse.json({ valid: false, error: "Invalid or revoked API Key" }, { status: 404 });
    }

    return NextResponse.json({
      valid: true,
      tier: user.plan,
      email: user.email,
      name: user.name,
      apiKey: user.apiKey,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ valid: false, error: msg }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const apiKey = searchParams.get("key");

  if (!apiKey) {
    return NextResponse.json({ valid: false, error: "API Key is required" }, { status: 400 });
  }

  const user = findUserByApiKey(apiKey);
  if (!user) {
    return NextResponse.json({ valid: false, error: "Invalid or revoked API Key" }, { status: 404 });
  }

  return NextResponse.json({
    valid: true,
    tier: user.plan,
    email: user.email,
    name: user.name,
    apiKey: user.apiKey,
  });
}
