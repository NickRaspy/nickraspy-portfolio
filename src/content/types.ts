export type Locale = string;
export type TranslationMap<T> = Record<Locale, T>;

export interface PortfolioContent {
  schemaVersion: 1;
  defaultLocale: Locale;
  locales: Locale[];
  profile: {
    id: string;
    status: string;
    clearance: string;
    translations: TranslationMap<{ role: string; summary: string }>;
  };
  skills: Array<{ id: string; name: string; level: number; sortOrder: number }>;
  experience: Array<{
    id: string;
    start: string;
    end: string;
    sortOrder: number;
    translations: TranslationMap<{ role: string; company: string; summary?: string }>;
  }>;
  categories: Array<{
    id: string;
    code: string;
    sortOrder: number;
    translations: TranslationMap<{ name: string; description?: string }>;
  }>;
  projects: Array<{
    id: string;
    categoryId: string;
    status: "draft" | "published" | "archived";
    year: number;
    sortOrder: number;
    liveUrl?: string;
    repositoryUrl?: string;
    technologies: string[];
    translations: TranslationMap<{ name: string; description?: string }>;
  }>;
  contacts: Array<{
    id: string;
    type: string;
    label: string;
    value: string;
    url: string;
    sortOrder: number;
    visible: boolean;
  }>;
}

export interface PortfolioView {
  locale: Locale;
  profile: { role: string; summary: string; status: string; clearance: string };
  skills: PortfolioContent["skills"];
  experience: Array<{ id: string; range: string; role: string; company: string }>;
  categories: Array<{ id: string; code: string; name: string }>;
  projects: Array<{ id: string; categoryId: string; code: string; name: string; description: string; tags: string[]; year: number; liveUrl?: string; repositoryUrl?: string }>;
  contacts: PortfolioContent["contacts"];
}

export interface ImportIssue {
  severity: "error" | "warning";
  sheet: string;
  row?: number;
  field?: string;
  message: string;
}

export interface ImportResult {
  content?: PortfolioContent;
  checksum?: string;
  issues: ImportIssue[];
  summary: { locales: number; categories: number; projects: number; skills: number; experience: number; contacts: number };
}
