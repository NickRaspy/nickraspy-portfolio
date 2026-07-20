import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const sessionCookie = "aetheris_admin";
const oauthStateCookie = "aetheris_oauth_state";
const sessionLifetimeSeconds = 60 * 60 * 12;

export interface AdminSession {
  login: string;
  expiresAt: number;
}

export function isLocalAdminBypass(): boolean {
  return process.env.NODE_ENV !== "production" && process.env.ADMIN_DEV_BYPASS === "true";
}

function secret(): string {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 32) throw new Error("AUTH_SECRET must contain at least 32 characters.");
  return value;
}

function signature(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export async function getAdminSession(): Promise<AdminSession | null> {
  if (isLocalAdminBypass()) return { login: "local-dev", expiresAt: Date.now() + sessionLifetimeSeconds * 1000 };
  const token = (await cookies()).get(sessionCookie)?.value;
  if (!token) return null;
  const [payload, providedSignature] = token.split(".");
  if (!payload || !providedSignature) return null;
  const expectedSignature = signature(payload);
  const provided = Buffer.from(providedSignature);
  const expected = Buffer.from(expectedSignature);
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) return null;
  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as AdminSession;
    return session.expiresAt > Date.now() ? session : null;
  } catch {
    return null;
  }
}

export async function setAdminSession(login: string): Promise<void> {
  const payload = Buffer.from(JSON.stringify({ login, expiresAt: Date.now() + sessionLifetimeSeconds * 1000 })).toString("base64url");
  (await cookies()).set(sessionCookie, `${payload}.${signature(payload)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: sessionLifetimeSeconds,
  });
}

export async function clearAdminSession(): Promise<void> {
  (await cookies()).delete(sessionCookie);
}

export async function createOAuthState(): Promise<string> {
  const state = randomBytes(24).toString("base64url");
  (await cookies()).set(oauthStateCookie, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  return state;
}

export async function consumeOAuthState(provided: string | null): Promise<boolean> {
  const store = await cookies();
  const expected = store.get(oauthStateCookie)?.value;
  store.delete(oauthStateCookie);
  if (!expected || !provided) return false;
  const expectedBuffer = Buffer.from(expected);
  const providedBuffer = Buffer.from(provided);
  return expectedBuffer.length === providedBuffer.length && timingSafeEqual(expectedBuffer, providedBuffer);
}

export function isAllowedGitHubLogin(login: string): boolean {
  return (process.env.ADMIN_GITHUB_LOGIN ?? "").split(",").map((value) => value.trim().toLowerCase()).filter(Boolean).includes(login.toLowerCase());
}

export function isGitHubAuthConfigured(): boolean {
  return Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET && process.env.ADMIN_GITHUB_LOGIN && process.env.AUTH_SECRET);
}
