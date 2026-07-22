import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const developmentSessionCookie = "aetheris_admin";
const productionSessionCookie = "__Host-aetheris_admin";
const developmentOAuthCookie = "aetheris_oauth_attempt";
const productionOAuthCookie = "__Host-aetheris_oauth_attempt";
const sessionLifetimeSeconds = 60 * 60 * 12;
const oauthLifetimeSeconds = 10 * 60;

export interface AdminSession {
  githubId: number;
  login: string;
  expiresAt: number;
}

interface GitHubIdentity {
  id: number;
  login: string;
}

export function isLocalAdminBypass(): boolean {
  return process.env.NODE_ENV !== "production" && process.env.ADMIN_DEV_BYPASS === "true";
}

function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

function sessionCookieName(): string {
  return isProduction() ? productionSessionCookie : developmentSessionCookie;
}

function oauthCookieName(): string {
  return isProduction() ? productionOAuthCookie : developmentOAuthCookie;
}

function secret(): string {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 32) throw new Error("AUTH_SECRET must contain at least 32 characters.");
  return value;
}

function signature(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

function safelyEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

export function getAuthOrigin(): string | null {
  const configured = process.env.AUTH_ORIGIN;
  if (!configured) return null;
  try {
    const url = new URL(configured);
    if (url.origin !== configured.replace(/\/$/, "")) return null;
    if (isProduction() && url.protocol !== "https:") return null;
    if (!isProduction() && !["http:", "https:"].includes(url.protocol)) return null;
    return url.origin;
  } catch {
    return null;
  }
}

export function isAllowedGitHubId(id: number): boolean {
  return (process.env.ADMIN_GITHUB_ID ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter((value) => /^\d+$/.test(value))
    .map(Number)
    .filter((value) => Number.isSafeInteger(value) && value > 0)
    .includes(id);
}

export async function getAdminSession(): Promise<AdminSession | null> {
  if (isLocalAdminBypass()) {
    return { githubId: 0, login: "local-dev", expiresAt: Date.now() + sessionLifetimeSeconds * 1000 };
  }
  const token = (await cookies()).get(sessionCookieName())?.value;
  if (!token) return null;
  const [payload, providedSignature] = token.split(".");
  try {
    if (!payload || !providedSignature || !safelyEqual(providedSignature, signature(payload))) return null;
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Partial<AdminSession>;
    if (
      typeof session.login !== "string" ||
      !Number.isSafeInteger(session.githubId) ||
      typeof session.expiresAt !== "number" ||
      session.expiresAt <= Date.now() ||
      !isAllowedGitHubId(session.githubId as number)
    ) return null;
    return session as AdminSession;
  } catch {
    return null;
  }
}

export async function setAdminSession(identity: GitHubIdentity): Promise<void> {
  const payload = Buffer.from(JSON.stringify({
    githubId: identity.id,
    login: identity.login,
    expiresAt: Date.now() + sessionLifetimeSeconds * 1000,
  })).toString("base64url");
  (await cookies()).set(sessionCookieName(), `${payload}.${signature(payload)}`, {
    httpOnly: true,
    secure: isProduction(),
    sameSite: "lax",
    path: "/",
    maxAge: sessionLifetimeSeconds,
    priority: "high",
  });
}

export async function clearAdminSession(): Promise<void> {
  const store = await cookies();
  store.delete(sessionCookieName());
  store.delete(isProduction() ? developmentSessionCookie : productionSessionCookie);
}

export async function createOAuthAttempt(): Promise<{ state: string; codeChallenge: string }> {
  const state = randomBytes(24).toString("base64url");
  const codeVerifier = randomBytes(32).toString("base64url");
  const codeChallenge = createHash("sha256").update(codeVerifier).digest("base64url");
  (await cookies()).set(oauthCookieName(), `${state}.${codeVerifier}`, {
    httpOnly: true,
    secure: isProduction(),
    sameSite: "lax",
    path: "/",
    maxAge: oauthLifetimeSeconds,
    priority: "high",
  });
  return { state, codeChallenge };
}

export async function consumeOAuthAttempt(providedState: string | null): Promise<string | null> {
  const store = await cookies();
  const attempt = store.get(oauthCookieName())?.value;
  store.delete(oauthCookieName());
  if (!attempt || !providedState) return null;
  const [expectedState, codeVerifier] = attempt.split(".");
  if (!expectedState || !codeVerifier || !safelyEqual(expectedState, providedState)) return null;
  return codeVerifier;
}

export function isGitHubAuthConfigured(): boolean {
  return Boolean(
    process.env.GITHUB_CLIENT_ID &&
    process.env.GITHUB_CLIENT_SECRET &&
    process.env.ADMIN_GITHUB_ID &&
    process.env.AUTH_SECRET &&
    process.env.AUTH_SECRET.length >= 32 &&
    getAuthOrigin()
  );
}
