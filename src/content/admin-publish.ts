import { createHash } from "node:crypto";
import { validatePortfolioContentForPublish } from "./importer";
import type { PortfolioContent } from "./types";

export interface AdminPublishDependencies {
  hasDatabase: () => boolean;
  migrateContentDatabase: () => Promise<void>;
  publishContent: (
    content: PortfolioContent,
    checksum: string,
    sourceFilename: string,
    createdBy: string,
  ) => Promise<string>;
  revalidatePortfolio: () => void;
}

export async function handleAdminPublish(
  request: Request,
  createdBy: string,
  dependencies: AdminPublishDependencies,
): Promise<Response> {
  if (!dependencies.hasDatabase()) {
    return Response.json({ error: "DATABASE_URL is not configured." }, { status: 503 });
  }

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
  await dependencies.migrateContentDatabase();
  const versionId = await dependencies.publishContent(
    validation.content,
    checksum,
    sourceFilename || "admin-upload.xlsx",
    createdBy,
  );
  dependencies.revalidatePortfolio();
  return Response.json({ versionId, checksum });
}
