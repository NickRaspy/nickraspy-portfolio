import { consumeOAuthState, isAllowedGitHubLogin, isGitHubAuthConfigured, setAdminSession } from "@/src/auth/admin";

export async function GET(request: Request) {
  const url = new URL(request.url);
  if (!isGitHubAuthConfigured() || !(await consumeOAuthState(url.searchParams.get("state")))) {
    return Response.redirect(new URL("/admin?auth=invalid", url));
  }
  const code = url.searchParams.get("code");
  if (!code) return Response.redirect(new URL("/admin?auth=missing_code", url));

  const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { accept: "application/json", "content-type": "application/json" },
    body: JSON.stringify({ client_id: process.env.GITHUB_CLIENT_ID, client_secret: process.env.GITHUB_CLIENT_SECRET, code }),
    cache: "no-store",
  });
  const token = await tokenResponse.json() as { access_token?: string };
  if (!token.access_token) return Response.redirect(new URL("/admin?auth=token_failed", url));

  const userResponse = await fetch("https://api.github.com/user", {
    headers: { accept: "application/vnd.github+json", authorization: `Bearer ${token.access_token}`, "x-github-api-version": "2022-11-28" },
    cache: "no-store",
  });
  const user = await userResponse.json() as { login?: string };
  if (!user.login || !isAllowedGitHubLogin(user.login)) return Response.redirect(new URL("/admin?auth=forbidden", url));
  await setAdminSession(user.login);
  return Response.redirect(new URL("/admin", url));
}
