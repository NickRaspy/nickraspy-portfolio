import { createOAuthState, isGitHubAuthConfigured } from "@/src/auth/admin";

export async function GET(request: Request) {
  if (!isGitHubAuthConfigured()) return Response.json({ error: "GitHub authentication is not configured." }, { status: 503 });
  const state = await createOAuthState();
  const callback = new URL("/api/auth/github/callback", request.url);
  const authorize = new URL("https://github.com/login/oauth/authorize");
  authorize.searchParams.set("client_id", process.env.GITHUB_CLIENT_ID!);
  authorize.searchParams.set("redirect_uri", callback.toString());
  authorize.searchParams.set("scope", "read:user");
  authorize.searchParams.set("state", state);
  return Response.redirect(authorize);
}
