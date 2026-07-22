import { createOAuthAttempt, getAuthOrigin, isGitHubAuthConfigured } from "@/src/auth/admin";

export async function GET() {
  if (!isGitHubAuthConfigured()) {
    return Response.json({ error: "GitHub authentication is not configured." }, { status: 503 });
  }

  const authOrigin = getAuthOrigin()!;
  const { state, codeChallenge } = await createOAuthAttempt();
  const authorize = new URL("https://github.com/login/oauth/authorize");
  authorize.searchParams.set("client_id", process.env.GITHUB_CLIENT_ID!);
  authorize.searchParams.set("redirect_uri", new URL("/api/auth/github/callback", authOrigin).toString());
  authorize.searchParams.set("scope", "read:user");
  authorize.searchParams.set("state", state);
  authorize.searchParams.set("code_challenge", codeChallenge);
  authorize.searchParams.set("code_challenge_method", "S256");
  authorize.searchParams.set("allow_signup", "false");
  return Response.redirect(authorize);
}
