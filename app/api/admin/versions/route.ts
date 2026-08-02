import { getAdminSession } from "@/src/auth/admin";
import { listContentVersions } from "@/src/content/repository";

export async function GET() {
  if (!(await getAdminSession())) return Response.json({ error: "Unauthorized." }, { status: 401 });
  return Response.json({ versions: await listContentVersions(30) });
}
