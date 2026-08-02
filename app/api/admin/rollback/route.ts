import { revalidateTag } from "next/cache";
import { authorizeAdminMutation } from "@/src/auth/request";
import { handleAdminRollback } from "@/src/content/admin-rollback";
import { rollbackContent } from "@/src/content/repository";

export async function POST(request: Request) {
  const authorization = await authorizeAdminMutation(request);
  if ("error" in authorization) return authorization.error;
  return handleAdminRollback(request, authorization.session, {
    rollbackContent,
    revalidatePortfolio: () => revalidateTag("portfolio-data", "max"),
  });
}
