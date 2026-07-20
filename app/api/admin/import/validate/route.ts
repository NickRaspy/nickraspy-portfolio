import { authorizeAdminMutation } from "@/src/auth/request";
import { importPortfolioWorkbook } from "@/src/content/importer";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: Request) {
  const authorization = await authorizeAdminMutation(request);
  if ("error" in authorization) return authorization.error;
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return Response.json({ error: "Excel file is required." }, { status: 400 });
  if (!file.name.toLowerCase().endsWith(".xlsx")) return Response.json({ error: "Only .xlsx files are supported." }, { status: 415 });
  if (file.size > 5 * 1024 * 1024) return Response.json({ error: "The workbook must be smaller than 5 MB." }, { status: 413 });

  try {
    const result = await importPortfolioWorkbook(await file.arrayBuffer());
    return Response.json({ ...result, sourceFilename: file.name }, { status: result.content ? 200 : 422 });
  } catch (error) {
    console.error("Workbook validation failed.", error);
    return Response.json({ error: "The workbook could not be read. Check that it is a valid .xlsx file." }, { status: 422 });
  }
}
