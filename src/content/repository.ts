import postgres, { type Sql } from "postgres";
import fallbackContent from "@/content/fallback/portfolio.json";
import type { PortfolioContent } from "./types";

export interface ContentVersion {
  id: string;
  checksum: string;
  sourceFilename: string;
  createdBy: string;
  createdAt: string;
  publishedAt: string | null;
  active: boolean;
}

let client: Sql | undefined;

export function hasDatabase(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

function sql(): Sql {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not configured.");
  client ??= postgres(process.env.DATABASE_URL, { max: 2, prepare: false });
  return client;
}

export async function getPublishedContent(): Promise<PortfolioContent> {
  if (!hasDatabase()) return fallbackContent as PortfolioContent;
  try {
    const rows = await sql()<[{ content: PortfolioContent }]>`
      select versions.content
      from portfolio_content_state state
      join portfolio_content_versions versions on versions.id = state.active_version_id
      where state.singleton = true
      limit 1
    `;
    return rows[0]?.content ?? (fallbackContent as PortfolioContent);
  } catch (error) {
    console.error("Portfolio database unavailable; serving fallback content.", error);
    return fallbackContent as PortfolioContent;
  }
}

export async function publishContent(content: PortfolioContent, checksum: string, sourceFilename: string, createdBy: string): Promise<string> {
  const db = sql();
  return db.begin(async (transaction) => {
    const rows = await transaction<{ id: string }[]>`
      insert into portfolio_content_versions (checksum, source_filename, content, created_by, published_at)
      values (${checksum}, ${sourceFilename}, ${transaction.json(content as unknown as Parameters<typeof transaction.json>[0])}, ${createdBy}, now())
      on conflict (checksum) do update set published_at = now()
      returning id
    `;
    const versionId = rows[0].id;
    await transaction`update portfolio_content_state set active_version_id = ${versionId} where singleton = true`;
    return versionId;
  });
}

export async function listContentVersions(limit = 20): Promise<ContentVersion[]> {
  if (!hasDatabase()) return [];
  const rows = await sql()<Array<{
    id: string;
    checksum: string;
    source_filename: string;
    created_by: string;
    created_at: Date;
    published_at: Date | null;
    active: boolean;
  }>>`
    select versions.id, versions.checksum, versions.source_filename, versions.created_by,
      versions.created_at, versions.published_at, (state.active_version_id = versions.id) as active
    from portfolio_content_versions versions
    cross join portfolio_content_state state
    order by versions.created_at desc
    limit ${limit}
  `;
  return rows.map((row) => ({
    id: row.id,
    checksum: row.checksum,
    sourceFilename: row.source_filename,
    createdBy: row.created_by,
    createdAt: row.created_at.toISOString(),
    publishedAt: row.published_at?.toISOString() ?? null,
    active: row.active,
  }));
}

export async function rollbackContent(versionId: string): Promise<void> {
  const db = sql();
  const result = await db`update portfolio_content_state set active_version_id = ${versionId} where singleton = true and exists (select 1 from portfolio_content_versions where id = ${versionId})`;
  if (result.count !== 1) throw new Error(`Content version ${versionId} was not found.`);
}

export async function closeContentDatabase(): Promise<void> {
  const current = client;
  client = undefined;
  if (current) await current.end({ timeout: 5 });
}
