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

export interface ContentActor {
  githubId: number | null;
  login: string;
}

export interface ContentAuditEvent {
  id: string;
  action: "publish" | "rollback";
  actorGitHubId: string | null;
  actorLogin: string;
  fromVersionId: string | null;
  toVersionId: string;
  toVersionChecksum: string;
  occurredAt: string;
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

function normalizeActor(actor: ContentActor): ContentActor {
  const login = actor.login.trim();
  if (login.length === 0) throw new Error("Content actor login is required.");
  const githubId = actor.githubId === null || !Number.isSafeInteger(actor.githubId) || actor.githubId <= 0
    ? null
    : actor.githubId;
  return { githubId, login };
}

export async function publishContent(content: PortfolioContent, checksum: string, sourceFilename: string, actor: ContentActor): Promise<string> {
  const db = sql();
  return db.begin(async (transaction) => {
    const normalizedActor = normalizeActor(actor);
    const stateRows = await transaction<Array<{ active_version_id: string | null }>>`
      select active_version_id
      from portfolio_content_state
      where singleton = true
      for update
    `;
    const previousVersionId = stateRows[0]?.active_version_id ?? null;
    const rows = await transaction<{ id: string }[]>`
      insert into portfolio_content_versions (checksum, source_filename, content, created_by, published_at)
      values (${checksum}, ${sourceFilename}, ${transaction.json(content as unknown as Parameters<typeof transaction.json>[0])}, ${normalizedActor.login}, now())
      on conflict (checksum) do update set published_at = now()
      returning id
    `;
    const versionId = rows[0].id;
    const stateUpdate = await transaction`
      update portfolio_content_state
      set active_version_id = ${versionId}
      where singleton = true
    `;
    if (stateUpdate.count !== 1) throw new Error("Portfolio content state was not initialized.");
    await transaction`
      insert into portfolio_content_audit_log (
        action, actor_github_id, actor_login, from_version_id, to_version_id
      ) values (
        'publish', ${normalizedActor.githubId}, ${normalizedActor.login}, ${previousVersionId}, ${versionId}
      )
    `;
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

export async function listContentAuditEvents(limit = 50): Promise<ContentAuditEvent[]> {
  if (!hasDatabase()) return [];
  const rows = await sql()<Array<{
    id: string;
    action: "publish" | "rollback";
    actor_github_id: string | number | null;
    actor_login: string;
    from_version_id: string | null;
    to_version_id: string;
    to_version_checksum: string;
    occurred_at: Date;
  }>>`
    select audit.id, audit.action, audit.actor_github_id, audit.actor_login,
      audit.from_version_id, audit.to_version_id, target.checksum as to_version_checksum,
      audit.occurred_at
    from portfolio_content_audit_log audit
    join portfolio_content_versions target on target.id = audit.to_version_id
    order by audit.occurred_at desc
    limit ${limit}
  `;
  return rows.map((row) => ({
    id: row.id,
    action: row.action,
    actorGitHubId: row.actor_github_id === null ? null : String(row.actor_github_id),
    actorLogin: row.actor_login,
    fromVersionId: row.from_version_id,
    toVersionId: row.to_version_id,
    toVersionChecksum: row.to_version_checksum,
    occurredAt: row.occurred_at.toISOString(),
  }));
}

export async function rollbackContent(versionId: string, actor: ContentActor): Promise<void> {
  const db = sql();
  await db.begin(async (transaction) => {
    const normalizedActor = normalizeActor(actor);
    const targetRows = await transaction<Array<{ id: string }>>`
      select id from portfolio_content_versions where id = ${versionId}
    `;
    if (!targetRows[0]) throw new Error(`Content version ${versionId} was not found.`);

    const stateRows = await transaction<Array<{ active_version_id: string | null }>>`
      select active_version_id
      from portfolio_content_state
      where singleton = true
      for update
    `;
    const previousVersionId = stateRows[0]?.active_version_id ?? null;
    const result = await transaction`
      update portfolio_content_state
      set active_version_id = ${versionId}
      where singleton = true
    `;
    if (result.count !== 1) throw new Error("Portfolio content state was not initialized.");
    await transaction`
      insert into portfolio_content_audit_log (
        action, actor_github_id, actor_login, from_version_id, to_version_id
      ) values (
        'rollback', ${normalizedActor.githubId}, ${normalizedActor.login}, ${previousVersionId}, ${versionId}
      )
    `;
  });
}

export async function closeContentDatabase(): Promise<void> {
  const current = client;
  client = undefined;
  if (current) await current.end({ timeout: 5 });
}
