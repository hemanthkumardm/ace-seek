import crypto from "crypto";

export type UserPlan = "free" | "pro" | "team";

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

// Global in-memory user registry for the Next.js runtime
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

/** Helper to generate a unique API Key based on plan */
export function generatePlanApiKey(userId: string, plan: UserPlan): string {
  const random = crypto.randomBytes(8).toString("hex");
  const prefix = plan === "pro" ? "ace_pro_usr" : plan === "team" ? "ace_team_usr" : "ace_free_usr";
  return `${prefix}_${userId.slice(0, 6)}_${random}`;
}

/** Seed demo default user if empty */
function seedDemoUser() {
  if (userMap.size === 0) {
    const demoId = "u_demo123";
    const demoUser: StoredUser = {
      id: demoId,
      email: "engineer@company.com",
      name: "Lead Hardware Engineer",
      passwordHash: hashPassword("password123"),
      plan: "pro",
      apiKey: generatePlanApiKey(demoId, "pro"),
      createdAt: Date.now(),
    };
    userMap.set(demoUser.email.toLowerCase(), demoUser);
  }
}

seedDemoUser();

export function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

export function registerUser(email: string, name: string, password: string, plan: UserPlan = "free"): StoredUser {
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
  const normalizedEmail = email.toLowerCase().trim();
  const user = userMap.get(normalizedEmail);
  if (!user) return null;

  if (user.passwordHash !== hashPassword(password)) {
    return null;
  }

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
    if (user.apiKey === trimmed) {
      return user;
    }
  }
  return null;
}
