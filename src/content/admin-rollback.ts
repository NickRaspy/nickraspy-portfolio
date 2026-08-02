import type { ContentActor } from "./repository";

export interface AdminRollbackDependencies {
  rollbackContent: (versionId: string, actor: ContentActor) => Promise<void>;
  revalidatePortfolio: () => void;
}

export async function handleAdminRollback(
  request: Request,
  actor: ContentActor,
  dependencies: AdminRollbackDependencies,
): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const versionId = body && typeof body === "object" && !Array.isArray(body)
    ? (body as Record<string, unknown>).versionId
    : undefined;
  if (typeof versionId !== "string" || !versionId.trim()) {
    return Response.json({ error: "versionId is required." }, { status: 400 });
  }

  await dependencies.rollbackContent(versionId, actor);
  dependencies.revalidatePortfolio();
  return Response.json({ versionId });
}
