import { getAdminSession } from "./admin";

export async function authorizeAdminMutation(request: Request) {
  const session = await getAdminSession();
  if (!session) return { error: Response.json({ error: "Unauthorized." }, { status: 401 }) };
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return { error: Response.json({ error: "Invalid request origin." }, { status: 403 }) };
  }
  return { session };
}
