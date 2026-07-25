import { importPortfolioWorkbook } from "./importer";

const maxWorkbookBytes = 4 * 1024 * 1024;

export async function validateAdminWorkbookFile(
  file: FormDataEntryValue | null,
): Promise<Response> {
  if (!(file instanceof File)) {
    return Response.json({ error: "Excel file is required." }, { status: 400 });
  }
  if (!file.name.toLowerCase().endsWith(".xlsx")) {
    return Response.json({ error: "Only .xlsx files are supported." }, { status: 415 });
  }
  if (file.size > maxWorkbookBytes) {
    return Response.json({ error: "The workbook must be 4 MB or smaller." }, { status: 413 });
  }

  try {
    const result = await importPortfolioWorkbook(await file.arrayBuffer());
    return Response.json(
      { ...result, sourceFilename: file.name },
      { status: result.content ? 200 : 422 },
    );
  } catch (error) {
    console.error("Workbook validation failed.", error);
    return Response.json(
      { error: "The workbook could not be read. Check that it is a valid .xlsx file." },
      { status: 422 },
    );
  }
}
