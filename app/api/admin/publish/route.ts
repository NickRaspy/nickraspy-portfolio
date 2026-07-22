import { createHash } from "node:crypto";
import { revalidateTag } from "next/cache";
import { authorizeAdminMutation } from "@/src/auth/request";
import { validatePortfolioContentForPublish } from "@/src/content/importer";
import { hasDatabase, migrateContentDatabase, publishContent } from "@/src/content/repository";
import type { PortfolioContent } from "@/src/content/types";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: Request) {
  const authorization = await authorizeAdminMutation(request);
  if ("error" in authorization) return authorization.error;
  if (!hasDatabase()) return Response.json({ error: "DATABASE_URL is not configured." }, { status: 503 });
  const body = await request.json() as { content?: PortfolioContent; sourceFilename?: string };
  const validation = validatePortfolioContentForPublish(body.content);
  if (!validation.valid || !body.content) return Response.json({ error: "Content validation failed.", issues: validation.issues }, { status: 422 });

  const checksum = createHash("sha256").update(JSON.stringify(body.content)).digest("hex");
  await migrateContentDatabase();
  const versionId = await publishContent(body.content, checksum, body.sourceFilename?.slice(0, 180) || "admin-upload.xlsx", authorization.session.login);
  revalidateTag("portfolio-data", "max");
  return Response.json({ versionId, checksum });
}
