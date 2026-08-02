import { authorizeAdminMutation } from "@/src/auth/request";
import { validateAdminWorkbookFile } from "@/src/content/admin-import";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: Request) {
  const authorization = await authorizeAdminMutation(request);
  if ("error" in authorization) return authorization.error;
  const form = await request.formData();
  return validateAdminWorkbookFile(form.get("file"));
}
