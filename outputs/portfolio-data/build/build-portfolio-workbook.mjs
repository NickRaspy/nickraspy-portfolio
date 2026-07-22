import fs from "node:fs/promises";
import path from "node:path";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const root = path.resolve(import.meta.dirname, "../../..");
const outputDir = path.join(root, "outputs/portfolio-data");
const qaDir = path.join(outputDir, "qa");
await fs.mkdir(qaDir, { recursive: true });

const workbook = Workbook.create();
const accent = "#00F2FF";
const accentSoft = "#0E5463";
const background = "#06131D";
const surface = "#0B2230";
const foreground = "#D9F8FF";
const muted = "#8FB6C2";

const sheets = [
  {
    name: "README",
    headers: ["Раздел", "Описание"],
    rows: [
      ["Назначение", "Этот файл — единый редактируемый источник данных портфолио."],
      ["Порядок", "Редактируй данные → npm run content:validate → npm run content:sync."],
      ["Идентификаторы", "Используй только строчные латинские буквы, цифры, _ и -. Не меняй ID после публикации без необходимости."],
      ["Переводы", "Для каждого профиля, проекта, раздела и места работы нужен перевод на каждую локаль из settings."],
      ["Публикация", "Статус published выводит проект на сайт; draft и archived скрыты."],
    ],
    widths: [22, 92],
  },
  { name: "settings", headers: ["key", "value"], rows: [["default_locale", "en"], ["locales", "en,ru"]], widths: [24, 32] },
  { name: "profile", headers: ["profile_id", "status", "clearance"], rows: [["nickraspy", "ONLINE", "LEVEL_5"]], widths: [24, 20, 20] },
  {
    name: "profile_i18n",
    headers: ["profile_id", "locale", "role", "summary"],
    rows: [
      ["nickraspy", "en", "Senior Full-stack Developer", "Specializing in high-performance holographic interfaces and secure data processing architectures."],
      ["nickraspy", "ru", "Senior Full-stack разработчик", "Специализируюсь на производительных интерфейсах и безопасных архитектурах обработки данных."],
    ],
    widths: [20, 12, 34, 78],
  },
  {
    name: "skills",
    headers: ["skill_id", "name", "level", "sort_order"],
    rows: [["core_arch", "CORE_ARCH", 95, 10], ["neural_net", "NEURAL_NET", 82, 20], ["holo_ui", "HOLO_UI", 99, 30]],
    widths: [22, 24, 12, 16],
  },
  {
    name: "experience",
    headers: ["experience_id", "start", "end", "sort_order"],
    rows: [["lead", "2021", "CUR", 10], ["frontend", "2018", "2021", 20]],
    widths: [24, 14, 14, 16],
  },
  {
    name: "experience_i18n",
    headers: ["experience_id", "locale", "role", "company", "summary"],
    rows: [
      ["lead", "en", "LEAD_ARCHITECT", "INDEPENDENT", "Architecture and product engineering."],
      ["lead", "ru", "ВЕДУЩИЙ_АРХИТЕКТОР", "НЕЗАВИСИМО", "Архитектура и продуктовая разработка."],
      ["frontend", "en", "FRONTEND_ENG", "SYSTEMS", "Interface engineering."],
      ["frontend", "ru", "FRONTEND_ИНЖЕНЕР", "SYSTEMS", "Разработка интерфейсов."],
    ],
    widths: [24, 12, 30, 24, 56],
  },
  {
    name: "categories",
    headers: ["category_id", "code", "sort_order"],
    rows: [["web", "CAT_WEB_CORE", 10], ["mobile", "CAT_MOBILE_UX", 20], ["systems", "CAT_SYS_MODS", 30]],
    widths: [22, 28, 16],
  },
  {
    name: "category_i18n",
    headers: ["category_id", "locale", "name", "description"],
    rows: [
      ["web", "en", "Web Core", "Web applications"], ["web", "ru", "Веб", "Веб-приложения"],
      ["mobile", "en", "Mobile UX", "Mobile products"], ["mobile", "ru", "Мобильные", "Мобильные продукты"],
      ["systems", "en", "Systems", "System software"], ["systems", "ru", "Системы", "Системное ПО"],
    ],
    widths: [22, 12, 28, 48],
  },
  {
    name: "projects",
    headers: ["project_id", "category_id", "status", "year", "sort_order", "live_url", "repository_url"],
    rows: [
      ["wa-01", "web", "published", 2026, 10, null, null],
      ["wa-02", "web", "published", 2025, 20, null, null],
      ["ma-01", "mobile", "published", 2025, 10, null, null],
      ["sa-01", "systems", "published", 2024, 10, null, null],
    ],
    widths: [18, 18, 18, 12, 16, 42, 42],
  },
  {
    name: "project_i18n",
    headers: ["project_id", "locale", "name", "description"],
    rows: [
      ["wa-01", "en", "Project Alpha", "Real-time neural observability interface for dense, high-stakes data."],
      ["wa-01", "ru", "Проект Альфа", "Интерфейс наблюдаемости в реальном времени для насыщенных критичных данных."],
      ["wa-02", "en", "Neural Bridge", "Encrypted control layer for mapping human signals into digital workflows."],
      ["wa-02", "ru", "Нейронный мост", "Защищённый слой управления цифровыми процессами."],
      ["ma-01", "en", "Quantum UX", "Context-aware mobile product that adapts its interface to intent and environment."],
      ["ma-01", "ru", "Квантовый UX", "Мобильный продукт, адаптирующий интерфейс к намерению и окружению."],
      ["sa-01", "en", "Core Sentinel", "Low-level monitoring console with live threat scoring and automated response flows."],
      ["sa-01", "ru", "Страж ядра", "Низкоуровневая консоль мониторинга и автоматического реагирования."],
    ],
    widths: [18, 12, 30, 82],
  },
  {
    name: "project_technologies",
    headers: ["project_id", "technology", "sort_order"],
    rows: [
      ["wa-01", "React", 10], ["wa-01", "WebGL", 20], ["wa-02", "TypeScript", 10], ["wa-02", "D3.js", 20],
      ["ma-01", "React Native", 10], ["ma-01", "Rust", 20], ["sa-01", "Go", 10], ["sa-01", "eBPF", 20],
    ],
    widths: [20, 28, 16],
  },
  {
    name: "contacts",
    headers: ["contact_id", "type", "label", "value", "url", "sort_order", "visible"],
    rows: [["email", "email", "Email", "hello@example.com", "mailto:hello@example.com", 10, true]],
    widths: [20, 16, 20, 36, 42, 16, 14],
  },
];

function columnName(index) {
  let name = "";
  for (let value = index + 1; value > 0; value = Math.floor((value - 1) / 26)) name = String.fromCharCode(65 + ((value - 1) % 26)) + name;
  return name;
}

for (const definition of sheets) {
  const sheet = workbook.worksheets.add(definition.name);
  sheet.showGridLines = false;
  const matrix = [definition.headers, ...definition.rows];
  const endColumn = columnName(definition.headers.length - 1);
  const range = sheet.getRange(`A1:${endColumn}${matrix.length}`);
  range.values = matrix;
  range.format = {
    fill: background,
    font: { color: foreground, name: "Aptos", size: 11 },
    verticalAlignment: "center",
    borders: { insideHorizontal: { style: "thin", color: "#173746" } },
  };
  const header = sheet.getRange(`A1:${endColumn}1`);
  header.format = {
    fill: surface,
    font: { color: accent, bold: true, name: "Consolas", size: 11 },
    rowHeight: 28,
    borders: { bottom: { style: "medium", color: accentSoft } },
  };
  sheet.getRange(`A2:${endColumn}${matrix.length}`).format.rowHeight = definition.name.endsWith("_i18n") ? 34 : 25;
  definition.widths.forEach((width, index) => {
    sheet.getRange(`${columnName(index)}:${columnName(index)}`).format.columnWidth = width;
  });
  range.format.wrapText = definition.name.endsWith("_i18n") || definition.name === "README";
  sheet.freezePanes.freezeRows(1);
  const tableName = `T_${definition.name.replace(/[^a-z0-9]/gi, "_")}`;
  const table = sheet.tables.add(`A1:${endColumn}${matrix.length}`, true, tableName);
  table.style = "TableStyleMedium2";
  table.showBandedColumns = false;

  if (definition.name === "projects") sheet.getRange("C2:C200").dataValidation = { rule: { type: "list", values: ["draft", "published", "archived"] } };
  if (definition.name === "contacts") sheet.getRange("G2:G200").dataValidation = { rule: { type: "list", values: [true, false] } };
  if (definition.name.endsWith("_i18n")) sheet.getRange("B2:B200").dataValidation = { rule: { type: "list", values: ["en", "ru"] } };
  if (definition.name === "skills") {
    sheet.getRange("C2:C200").dataValidation = { rule: { type: "whole", operator: "between", formula1: 0, formula2: 100 } };
    sheet.getRange("C2:C4").format.numberFormat = "0";
  }
  if (definition.name === "projects") sheet.getRange("D2:E5").format.numberFormat = "0";
  if (definition.name === "README") {
    sheet.getRange("A2:A6").format = { fill: surface, font: { color: accent, bold: true } };
    sheet.getRange("B2:B6").format.font = { color: muted };
  }
}

const inspection = await workbook.inspect({
  kind: "table",
  range: "projects!A1:G5",
  include: "values,formulas",
  tableMaxRows: 8,
  tableMaxCols: 8,
});
console.log(inspection.ndjson);

const errors = await workbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 100 },
  summary: "final formula error scan",
});
console.log(errors.ndjson);

for (const definition of sheets) {
  const preview = await workbook.render({ sheetName: definition.name, autoCrop: "all", scale: 1, format: "png" });
  await fs.writeFile(path.join(qaDir, `${definition.name}.png`), new Uint8Array(await preview.arrayBuffer()));
}

const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(path.join(outputDir, "portfolio.xlsx"));
console.log(path.join(outputDir, "portfolio.xlsx"));
