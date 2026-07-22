import {
  consumeOAuthAttempt,
  getAuthOrigin,
  isAllowedGitHubId,
  isGitHubAuthConfigured,
  setAdminSession,
} from "@/src/auth/admin";

function adminRedirect(origin: string, error?: string): Response {
  const target = new URL("/admin", origin);
  if (error) target.searchParams.set("auth", error);
  return Response.redirect(target);
}

export async function GET(request: Request) {
  const authOrigin = getAuthOrigin();
  if (!authOrigin || !isGitHubAuthConfigured()) {
    return Response.json({ error: "GitHub authentication is not configured." }, { status: 503 });
  }

  const url = new URL(request.url);
  const codeVerifier = await consumeOAuthAttempt(url.searchParams.get("state"));
  if (!codeVerifier) return adminRedirect(authOrigin, "invalid");

  const code = url.searchParams.get("code");
  if (!code) return adminRedirect(authOrigin, "missing_code");

  try {
    const callback = new URL("/api/auth/github/callback", authOrigin).toString();
    const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { accept: "application/json", "content-type": "application/json" },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: callback,
        code_verifier: codeVerifier,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    const token = await tokenResponse.json() as { access_token?: string };
    if (!tokenResponse.ok || !token.access_token) return adminRedirect(authOrigin, "token_failed");

    const userResponse = await fetch("https://api.github.com/user", {
      headers: {
        accept: "application/vnd.github+json",
        authorization: `Bearer ${token.access_token}`,
        "x-github-api-version": "2022-11-28",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    const user = await userResponse.json() as { id?: number; login?: string };
    if (
      !userResponse.ok ||
      !Number.isSafeInteger(user.id) ||
      !user.login ||
      !isAllowedGitHubId(user.id as number)
    ) return adminRedirect(authOrigin, "forbidden");

    await setAdminSession({ id: user.id as number, login: user.login });
    return adminRedirect(authOrigin);
  } catch (error) {
    console.error("GitHub OAuth exchange failed.", error);
    return adminRedirect(authOrigin, "provider_failed");
  }
}
