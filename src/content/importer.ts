import { createHash } from "node:crypto";
import Ajv2020 from "ajv/dist/2020.js";
import readXlsxFile, { type CellValue } from "read-excel-file/node";
import portfolioSchema from "@/content/schema/portfolio.schema.json";
import type { ImportIssue, ImportResult, PortfolioContent, TranslationMap } from "./types";

type RowRecord = Record<string, CellValue> & { __row: number };
type WorkbookSheets = Record<string, RowRecord[]>;

const requiredSheets = [
  "settings", "profile", "profile_i18n", "skills", "experience", "experience_i18n",
  "categories", "category_i18n", "projects", "project_i18n", "project_technologies", "contacts",
] as const;

const ajv = new Ajv2020({ allErrors: true, strict: false });
const validateSchema = ajv.compile<PortfolioContent>(portfolioSchema);

function text(value: CellValue | undefined): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).trim();
}

function integer(value: CellValue | undefined, fallback = 0): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : fallback;
}

function boolean(value: CellValue | undefined): boolean {
  return ["1", "true", "yes", "y", "да"].includes(text(value).toLowerCase());
}

function rowsToRecords(rows: CellValue[][]): RowRecord[] {
  const headers = (rows[0] ?? []).map((value) => text(value));
  return rows.slice(1).flatMap((row, index) => {
    if (row.every((value) => value === null || text(value) === "")) return [];
    const record = { __row: index + 2 } as RowRecord;
    headers.forEach((header, column) => {
      if (header) record[header] = row[column] ?? null;
    });
    return [record];
  });
}

function addIssue(issues: ImportIssue[], sheet: string, row: number | undefined, field: string | undefined, message: string) {
  issues.push({ severity: "error", sheet, row, field, message });
}

function isSafeExternalUrl(value: string, allowedProtocols: ReadonlySet<string>): boolean {
  if (!value) return true;
  try {
    const url = new URL(value);
    if (!allowedProtocols.has(url.protocol)) return false;
    if ((url.protocol === "http:" || url.protocol === "https:") && (!url.hostname || url.username || url.password)) return false;
    return true;
  } catch {
    return false;
  }
}

function validateExternalUrls(content: PortfolioContent): ImportIssue[] {
  const issues: ImportIssue[] = [];
  const webProtocols = new Set(["http:", "https:"]);
  const contactProtocols = new Set(["http:", "https:", "mailto:", "tel:"]);

  content.projects.forEach((project, index) => {
    if (!isSafeExternalUrl(project.liveUrl ?? "", webProtocols)) {
      addIssue(issues, "links", undefined, `/projects/${index}/liveUrl`, "Only absolute http:// or https:// links are allowed.");
    }
    if (!isSafeExternalUrl(project.repositoryUrl ?? "", webProtocols)) {
      addIssue(issues, "links", undefined, `/projects/${index}/repositoryUrl`, "Only absolute http:// or https:// links are allowed.");
    }
  });
  content.contacts.forEach((contact, index) => {
    if (!isSafeExternalUrl(contact.url, contactProtocols)) {
      addIssue(issues, "links", undefined, `/contacts/${index}/url`, "Only http://, https://, mailto:, or tel: links are allowed.");
    }
  });
  return issues;
}

function jsonPointerSegment(value: string): string {
  return value.replaceAll("~", "~0").replaceAll("/", "~1");
}

function validateUniqueIds(
  items: ReadonlyArray<{ id: string }>,
  sheet: string,
  issues: ImportIssue[],
) {
  const seen = new Map<string, number>();
  items.forEach((item, index) => {
    const previousIndex = seen.get(item.id);
    if (previousIndex !== undefined) {
      addIssue(
        issues,
        sheet,
        undefined,
        `/${sheet}/${index}/id`,
        `ID «${item.id}» already appears at /${sheet}/${previousIndex}/id.`,
      );
      return;
    }
    seen.set(item.id, index);
  });
}

function validateRequiredTranslations(content: PortfolioContent, issues: ImportIssue[]) {
  const translatedEntities: Array<{
    sheet: string;
    id: string;
    field: string;
    translations: TranslationMap<unknown>;
  }> = [
    { sheet: "profile_i18n", id: content.profile.id, field: "/profile/translations", translations: content.profile.translations },
    ...content.categories.map((item, index) => ({
      sheet: "category_i18n", id: item.id, field: `/categories/${index}/translations`, translations: item.translations,
    })),
    ...content.projects.map((item, index) => ({
      sheet: "project_i18n", id: item.id, field: `/projects/${index}/translations`, translations: item.translations,
    })),
    ...content.experience.map((item, index) => ({
      sheet: "experience_i18n", id: item.id, field: `/experience/${index}/translations`, translations: item.translations,
    })),
  ];

  translatedEntities.forEach((entity) => content.locales.forEach((locale) => {
    if (!Object.hasOwn(entity.translations, locale)) {
      addIssue(
        issues,
        entity.sheet,
        undefined,
        `${entity.field}/${jsonPointerSegment(locale)}`,
        `Translation ${locale} is missing for «${entity.id}».`,
      );
    }
  }));
}

function validateContentRelationships(content: PortfolioContent): ImportIssue[] {
  const issues: ImportIssue[] = [];
  if (!content.locales.includes(content.defaultLocale)) {
    addIssue(issues, "settings", undefined, "/defaultLocale", "defaultLocale must be included in locales.");
  }
  validateUniqueIds(content.skills, "skills", issues);
  validateUniqueIds(content.experience, "experience", issues);
  validateUniqueIds(content.categories, "categories", issues);
  validateUniqueIds(content.projects, "projects", issues);
  validateUniqueIds(content.contacts, "contacts", issues);
  const categoryIds = new Set(content.categories.map((item) => item.id));
  content.projects.forEach((project, index) => {
    if (!categoryIds.has(project.categoryId)) {
      addIssue(
        issues,
        "projects",
        undefined,
        `/projects/${index}/categoryId`,
        `Category «${project.categoryId}» does not exist.`,
      );
    }
  });
  validateRequiredTranslations(content, issues);
  return issues;
}

function translationMap<T>(rows: RowRecord[], idField: string, id: string, builder: (row: RowRecord) => T): TranslationMap<T> {
  return Object.fromEntries(rows.filter((row) => text(row[idField]) === id).map((row) => [text(row.locale), builder(row)]));
}

export async function importPortfolioWorkbook(input: Buffer | ArrayBuffer): Promise<ImportResult> {
  const buffer = Buffer.isBuffer(input) ? input : Buffer.from(input);
  const issues: ImportIssue[] = [];
  const sheets: WorkbookSheets = {};
  const readAllSheets = readXlsxFile as unknown as (
    source: Buffer,
    options: { getSheets: true },
  ) => Promise<Array<{ sheet: string; data: CellValue[][] }>>;
  const sheetList = await readAllSheets(buffer, { getSheets: true });
  const sourceSheets = new Map(sheetList.map((sheet) => [sheet.sheet, sheet.data]));

  for (const sheet of requiredSheets) {
    const rows = sourceSheets.get(sheet);
    if (!rows) {
      addIssue(issues, sheet, undefined, undefined, "Обязательный лист отсутствует.");
      sheets[sheet] = [];
      continue;
    }
    sheets[sheet] = rowsToRecords(rows);
  }

  const settings = new Map(sheets.settings.map((row) => [text(row.key), text(row.value)]));
  const locales = (settings.get("locales") ?? "").split(",").map((locale) => locale.trim()).filter(Boolean);
  const defaultLocale = settings.get("default_locale") ?? locales[0] ?? "";
  if (!locales.length) addIssue(issues, "settings", undefined, "locales", "Укажите хотя бы одну локаль через запятую.");

  const profileRow = sheets.profile[0];
  if (!profileRow) addIssue(issues, "profile", undefined, undefined, "Добавьте строку профиля.");

  const content: PortfolioContent = {
    schemaVersion: 1,
    defaultLocale,
    locales,
    profile: {
      id: text(profileRow?.profile_id),
      status: text(profileRow?.status),
      clearance: text(profileRow?.clearance),
      translations: translationMap(sheets.profile_i18n, "profile_id", text(profileRow?.profile_id), (row) => ({ role: text(row.role), summary: text(row.summary) })),
    },
    skills: sheets.skills.map((row) => ({ id: text(row.skill_id), name: text(row.name), level: integer(row.level, -1), sortOrder: integer(row.sort_order) })),
    experience: sheets.experience.map((row) => ({
      id: text(row.experience_id), start: text(row.start), end: text(row.end), sortOrder: integer(row.sort_order),
      translations: translationMap(sheets.experience_i18n, "experience_id", text(row.experience_id), (item) => ({ role: text(item.role), company: text(item.company), summary: text(item.summary) })),
    })),
    categories: sheets.categories.map((row) => ({
      id: text(row.category_id), code: text(row.code), sortOrder: integer(row.sort_order),
      translations: translationMap(sheets.category_i18n, "category_id", text(row.category_id), (item) => ({ name: text(item.name), description: text(item.description) })),
    })),
    projects: sheets.projects.map((row) => ({
      id: text(row.project_id),
      categoryId: text(row.category_id),
      status: text(row.status) as PortfolioContent["projects"][number]["status"],
      year: integer(row.year),
      sortOrder: integer(row.sort_order),
      liveUrl: text(row.live_url),
      repositoryUrl: text(row.repository_url),
      technologies: sheets.project_technologies
        .filter((item) => text(item.project_id) === text(row.project_id))
        .sort((a, b) => integer(a.sort_order) - integer(b.sort_order))
        .map((item) => text(item.technology))
        .filter(Boolean),
      translations: translationMap(sheets.project_i18n, "project_id", text(row.project_id), (item) => ({ name: text(item.name), description: text(item.description) })),
    })),
    contacts: sheets.contacts.map((row) => ({
      id: text(row.contact_id), type: text(row.type), label: text(row.label), value: text(row.value), url: text(row.url),
      sortOrder: integer(row.sort_order), visible: boolean(row.visible),
    })),
  };

  const publicationValidation = validatePortfolioContentForPublish(content);
  issues.push(...publicationValidation.issues);

  const summary = {
    locales: content.locales.length,
    categories: content.categories.length,
    projects: content.projects.length,
    skills: content.skills.length,
    experience: content.experience.length,
    contacts: content.contacts.length,
  };

  if (issues.some((issue) => issue.severity === "error")) return { issues, summary };
  const checksum = createHash("sha256").update(JSON.stringify(content)).digest("hex");
  return { content, checksum, issues, summary };
}

export function validatePortfolioContentForPublish(
  value: unknown,
): { valid: false; issues: ImportIssue[] } | { valid: true; content: PortfolioContent; issues: ImportIssue[] } {
  const schemaValidation = validatePortfolioContent(value);
  if (!schemaValidation.valid) return { valid: false, issues: schemaValidation.issues };
  const content = value as PortfolioContent;
  const issues = [...validateContentRelationships(content), ...validateExternalUrls(content)];
  if (issues.length > 0) return { valid: false, issues };
  return { valid: true, content, issues };
}

export function validatePortfolioContent(value: unknown): { valid: boolean; issues: ImportIssue[] } {
  const valid = validateSchema(value);
  return {
    valid,
    issues: valid ? [] : (validateSchema.errors ?? []).map((error) => ({
      severity: "error" as const,
      sheet: "schema",
      field: error.instancePath || undefined,
      message: error.message ?? "Данные не соответствуют схеме.",
    })),
  };
}
