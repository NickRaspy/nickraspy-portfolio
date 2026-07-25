import { createHash } from "node:crypto";
import { revalidateTag } from "next/cache";
import { authorizeAdminMutation } from "@/src/auth/request";
import { validatePortfolioContentForPublish } from "@/src/content/importer";
import { hasDatabase, migrateContentDatabase, publishContent } from "@/src/content/repository";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: Request) {
  const authorization = await authorizeAdminMutation(request);
  if ("error" in authorization) return authorization.error;
  if (!hasDatabase()) return Response.json({ error: "DATABASE_URL is not configured." }, { status: 503 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const payload = body && typeof body === "object" && !Array.isArray(body)
    ? body as Record<string, unknown>
    : {};
  const validation = validatePortfolioContentForPublish(payload.content);
  if (!validation.valid) {
    return Response.json({ error: "Content validation failed.", issues: validation.issues }, { status: 422 });
  }

  const sourceFilename = typeof payload.sourceFilename === "string"
    ? payload.sourceFilename.slice(0, 180)
    : "";
  const checksum = createHash("sha256").update(JSON.stringify(validation.content)).digest("hex");
  await migrateContentDatabase();
  const versionId = await publishContent(
    validation.content,
    checksum,
    sourceFilename || "admin-upload.xlsx",
    authorization.session.login,
  );
  revalidateTag("portfolio-data", "max");
  return Response.json({ versionId, checksum });
}
