import { revalidateTag } from "next/cache";
import { authorizeAdminMutation } from "@/src/auth/request";
import { handleAdminPublish } from "@/src/content/admin-publish";
import { hasDatabase, migrateContentDatabase, publishContent } from "@/src/content/repository";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: Request) {
  const authorization = await authorizeAdminMutation(request);
  if ("error" in authorization) return authorization.error;
  return handleAdminPublish(request, authorization.session.login, {
    hasDatabase,
    migrateContentDatabase,
    publishContent,
    revalidatePortfolio: () => revalidateTag("portfolio-data", "max"),
  });
}
