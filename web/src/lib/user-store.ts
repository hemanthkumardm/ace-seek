import crypto from "crypto";

/** free < pro < max < team (team = max features + seats/billing) */
export type UserPlan = "free" | "pro" | "max" | "team";

export type StoredUser = {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  plan: UserPlan;
  apiKey: string;
  createdAt: number;
};

export type SessionTokenData = {
  userId: string;
  email: string;
  name: string;
  plan: UserPlan;
  apiKey: string;
};

const globalForUsers = globalThis as unknown as {
  __aceUsers: Map<string, StoredUser>;
  __aceSessions: Map<string, SessionTokenData>;
};

if (!globalForUsers.__aceUsers) {
  globalForUsers.__aceUsers = new Map<string, StoredUser>();
}
if (!globalForUsers.__aceSessions) {
  globalForUsers.__aceSessions = new Map<string, SessionTokenData>();
}

const userMap = globalForUsers.__aceUsers;
const sessionMap = globalForUsers.__aceSessions;

export function generatePlanApiKey(userId: string, plan: UserPlan): string {
  const random = crypto.randomBytes(8).toString("hex");
  const prefix =
    plan === "team"
      ? "ace_team_usr"
      : plan === "max"
        ? "ace_max_usr"
        : plan === "pro"
          ? "ace_pro_usr"
          : "ace_free_usr";
  return `${prefix}_${userId.slice(0, 6)}_${random}`;
}

/** Stable local-dev keys so Pro/Max/Team login does not change every restart. */
export const LOCAL_DEV_KEYS: Record<UserPlan, string> = {
  free: "ace_free_usr_local_devkey",
  pro: "ace_pro_usr_local_devkey",
  max: "ace_max_usr_local_devkey",
  team: "ace_team_usr_local_devkey",
};

export function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

function seedDemoUsers() {
  const demos: { email: string; name: string; plan: UserPlan; pass: string }[] = [
    {
      email: "free@ace-seek.com",
      name: "Free User",
      plan: "free",
      pass: "password123",
    },
    {
      email: "pro@ace-seek.com",
      name: "Pro Engineer",
      plan: "pro",
      pass: "password123",
    },
    {
      email: "max@ace-seek.com",
      name: "Max Power User",
      plan: "max",
      pass: "password123",
    },
    {
      email: "team@ace-seek.com",
      name: "Team Lead",
      plan: "team",
      pass: "password123",
    },
    // legacy demo used in docs
    {
      email: "engineer@company.com",
      name: "Lead Hardware Engineer",
      plan: "pro",
      pass: "password123",
    },
  ];

  for (const d of demos) {
    const id = "u_" + crypto.createHash("md5").update(d.email).digest("hex").slice(0, 8);
    userMap.set(d.email.toLowerCase(), {
      id,
      email: d.email.toLowerCase(),
      name: d.name,
      passwordHash: hashPassword(d.pass),
      plan: d.plan,
      apiKey: LOCAL_DEV_KEYS[d.plan],
      createdAt: Date.now(),
    });
  }
}

export function resolveLocalDevUser(raw: string): StoredUser | null {
  const s = raw.trim().toLowerCase();
  if (!s) return null;
  const byKey = findUserByApiKey(raw.trim());
  if (byKey) return byKey;
  if (s === "free" || s === "pro" || s === "max" || s === "team") {
    return findUserByEmail(`${s}@ace-seek.com`);
  }
  if (s.includes("@")) return findUserByEmail(s);
  if (LOCAL_DEV_KEYS.free === raw.trim()) return findUserByEmail("free@ace-seek.com");
  return null;
}

seedDemoUsers();

export function registerUser(
  email: string,
  name: string,
  password: string,
  plan: UserPlan = "free"
): StoredUser {
  const normalizedEmail = email.toLowerCase().trim();
  if (userMap.has(normalizedEmail)) {
    throw new Error("An account with this email already exists.");
  }

  const userId = "u_" + crypto.randomBytes(4).toString("hex");
  const apiKey = generatePlanApiKey(userId, plan);

  const newUser: StoredUser = {
    id: userId,
    email: normalizedEmail,
    name: name.trim() || normalizedEmail.split("@")[0],
    passwordHash: hashPassword(password),
    plan,
    apiKey,
    createdAt: Date.now(),
  };

  userMap.set(normalizedEmail, newUser);
  return newUser;
}

export function authenticateUser(email: string, password: string): StoredUser | null {
  const user = userMap.get(email.toLowerCase().trim());
  if (!user) return null;
  if (user.passwordHash !== hashPassword(password)) return null;
  return user;
}

export function createSessionToken(user: StoredUser): string {
  const token = "sess_" + crypto.randomBytes(16).toString("hex");
  sessionMap.set(token, {
    userId: user.id,
    email: user.email,
    name: user.name,
    plan: user.plan,
    apiKey: user.apiKey,
  });
  return token;
}

export function getSessionData(token: string): SessionTokenData | null {
  return sessionMap.get(token) || null;
}

export function destroySessionToken(token: string): void {
  sessionMap.delete(token);
}

export function findUserByApiKey(apiKey: string): StoredUser | null {
  const trimmed = apiKey.trim();
  for (const user of userMap.values()) {
    if (user.apiKey === trimmed) return user;
  }
  return null;
}

export function findUserByEmail(email: string): StoredUser | null {
  return userMap.get(email.toLowerCase().trim()) || null;
}

export function parseUserPlan(raw: unknown): UserPlan {
  const s = String(raw || "free").toLowerCase();
  if (s === "pro" || s === "max" || s === "team" || s === "free") return s;
  return "free";
}
