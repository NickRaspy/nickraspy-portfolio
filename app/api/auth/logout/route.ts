import { clearAdminSession } from "@/src/auth/admin";
import { authorizeAdminMutation } from "@/src/auth/request";

export async function POST(request: Request) {
  const authorization = await authorizeAdminMutation(request);
  if ("error" in authorization) return authorization.error;
  await clearAdminSession();
  return Response.redirect(new URL("/admin", request.url), 303);
}
