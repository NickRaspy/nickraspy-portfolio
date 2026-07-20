import { revalidateTag } from "next/cache";
import { authorizeAdminMutation } from "@/src/auth/request";
import { rollbackContent } from "@/src/content/repository";

export async function POST(request: Request) {
  const authorization = await authorizeAdminMutation(request);
  if ("error" in authorization) return authorization.error;
  const body = await request.json() as { versionId?: string };
  if (!body.versionId) return Response.json({ error: "versionId is required." }, { status: 400 });
  await rollbackContent(body.versionId);
  revalidateTag("portfolio-data", "max");
  return Response.json({ versionId: body.versionId });
}
