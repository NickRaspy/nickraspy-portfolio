# Graph Report - nickraspy-portfolio  (2026-08-03)

## Corpus Check
- 101 files · ~25,209 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 743 nodes · 1143 edges · 65 communities (53 shown, 12 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 13 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c6d96827`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- createSocialImage
- Admin API Publishing
- Schema Collection Rules
- Runtime Dependencies
- TypeScript Build Configuration
- Portfolio HUD Interface
- Required Schema Fields
- Content Operations Documentation
- GitHub OAuth Security
- Excel Import Validation
- Development Tooling
- Experience Translation Schema
- Contact Translation Schema
- Legacy Nebula Rendering
- Skill Category Schema
- Project Entry Schema
- Experience Entry Schema
- Profile Identity Schema
- Graphify Workflow Guide
- skill
- Root Layout Typography
- Browser Window Icon
- sortOrder
- Security Headers
- File Document Icon
- Revalidation Endpoint
- properties
- Content Version Database
- Legacy Cosmic Gas
- Legacy Starfield Rendering
- Globe Icon Asset
- Vercel Icon Asset
- ESLint Configuration
- PostCSS Configuration
- Next.js Icon Asset
- status
- vercel.json
- playwright.config.ts
- Q: Fix the attached Vercel build failure where admin-publish-route tests call cookies outside a request scope.
- Q: Почему локальные admin publish route tests снова прошли, а Vercel production build упал на cookies outside request scope?
- Q: Нормальные миграции БД: выполнять миграции отдельной командой, вести таблицу применённых миграций и не запускать их при публикации. Объясни, что собираешься делать.
- year
- Q: Единая серверная валидация: Повторно проверять публикуемый JSON на сервере либо выдавать подписанный одноразовый import-token. Что это значит и что будет сделано?
- translations
- spaceBackground.tsx
- Q: > WebGL recovery`n> Обрабатывать webglcontextlost, показывать CSS-fallback и динамически снижать качество по фактическому FPS.`n`nпоясни, что ты хотел здесь сделать
- $defs
- localizedText
- properties
- size
- Q: давай
- Q: Аудит действий админки: объясни, что ты хотел тут сделать
- size
- Q: Переменная SITE_URL с fallback на https://nickraspy.dev. Поясни зачем это.
- Q: Если я не владею nickraspy.dev, будет ли сайт использовать этот адрес?
- 002_content_audit_log.sql
- 001_content_versions.sql
- admin.ts
- $defs
- status
- Q: Why must localhost be removed from the SEO site origin?
- Q: What causes Cloudflare Turnstile client error 110200 in the contact form?

## God Nodes (most connected - your core abstractions)
1. `scripts` - 19 edges
2. `importPortfolioWorkbook()` - 16 edges
3. `compilerOptions` - 16 edges
4. `SupportedLocale` - 12 edges
5. `isSupportedLocale()` - 12 edges
6. `getAdminSession()` - 11 edges
7. `authorizeAdminMutation()` - 11 edges
8. `PortfolioContent` - 11 edges
9. `required` - 10 edges
10. `getRequestSiteUrl()` - 10 edges

## Surprising Connections (you probably didn't know these)
- `LocaleHome()` --calls--> `getPortfolioView()`  [EXTRACTED]
  app/[locale]/page.tsx → src/content/data.ts
- `POST()` --calls--> `handleAdminPublish()`  [EXTRACTED]
  app/api/admin/publish/route.ts → src/content/admin-publish.ts
- `POST()` --indirect_call--> `hasDatabase()`  [INFERRED]
  app/api/admin/publish/route.ts → src/content/repository.ts
- `POST()` --indirect_call--> `publishContent()`  [INFERRED]
  app/api/admin/publish/route.ts → src/content/repository.ts
- `POST()` --indirect_call--> `rollbackContent()`  [INFERRED]
  app/api/admin/rollback/route.ts → src/content/repository.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Aetheris Technical Architecture** — readme_nextjs_16, readme_webgl_hud, readme_postgresql_content, readme_excel_import_pipeline, readme_admin_console [EXTRACTED 1.00]
- **Portfolio Content Workflow** — readme_portfolio_workbook, readme_content_validate, readme_content_migrate, readme_content_sync, readme_content_history, readme_content_rollback [EXTRACTED 1.00]
- **GitHub Admin Security** — readme_github_oauth, readme_immutable_github_id_allowlist, readme_auth_origin, readme_oauth_pkce, readme_secure_admin_cookies [EXTRACTED 1.00]

## Communities (65 total, 12 thin omitted)

### Community 0 - "createSocialImage"
Cohesion: 0.57
Nodes (4): OpenGraphImage(), TwitterImage(), createSocialImage(), socialImageSize

### Community 1 - "Admin API Publishing"
Cohesion: 0.08
Nodes (39): AdminWorkbench(), ValidatedImport, AdminPublishDependencies, handleAdminPublish(), getCachedContent, getPortfolioView(), addIssue(), ajv (+31 more)

### Community 2 - "Schema Collection Rules"
Cohesion: 0.07
Nodes (33): items, type, items, type, minLength, type, items, type (+25 more)

### Community 3 - "Runtime Dependencies"
Cohesion: 0.05
Nodes (40): ajv, next, dependencies, ajv, next, postgres, react, react-dom (+32 more)

### Community 4 - "TypeScript Build Configuration"
Cohesion: 0.07
Nodes (28): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+20 more)

### Community 5 - "Portfolio HUD Interface"
Cohesion: 0.31
Nodes (10): main(), AppliedMigration, applyDatabaseMigrations(), DatabaseMigration, loadDatabaseMigrations(), MigrationExecutor, MigrationRunResult, pendingDatabaseMigrations() (+2 more)

### Community 6 - "Required Schema Fields"
Cohesion: 0.12
Nodes (15): additionalProperties, $id, required, $schema, title, type, categories, contacts (+7 more)

### Community 7 - "Content Operations Documentation"
Cohesion: 0.09
Nodes (23): Atomic Active Content Pointer, Protected Publishing Console, Local Admin Development Bypass, Aetheris Portfolio, Deployment Authentication Origin, Content History Command, Content Migration Command, Content Rollback Command (+15 more)

### Community 8 - "GitHub OAuth Security"
Cohesion: 0.07
Nodes (50): AdminPage(), metadata, POST(), POST(), POST(), GET(), adminRedirect(), GET() (+42 more)

### Community 9 - "Excel Import Validation"
Cohesion: 0.12
Nodes (21): HudBackground(), HudMessages, useContactForm(), tabs, DragHandler, ExperiencePanel(), Glyph(), HudMessages (+13 more)

### Community 10 - "Development Tooling"
Cohesion: 0.09
Nodes (23): eslint, eslint-config-next, fflate, devDependencies, eslint, eslint-config-next, fflate, @playwright/test (+15 more)

### Community 11 - "Experience Translation Schema"
Cohesion: 0.14
Nodes (17): additionalProperties, properties, $ref, required, type, additionalProperties, company, role (+9 more)

### Community 12 - "Contact Translation Schema"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: SEO: Добавить Open Graph, favicon-набор, robots.ts, sitemap.ts, canonical URL и JSON-LD Person/CreativeWork. Поясни, что ты хочешь тут сделать., Source Nodes

### Community 13 - "Legacy Nebula Rendering"
Cohesion: 0.32
Nodes (10): Nebula(), Props, clamp(), createNoise2D(), createValueNoise2D(), hexToRgb(), lerp(), mixRgb() (+2 more)

### Community 14 - "Skill Category Schema"
Cohesion: 0.11
Nodes (26): ContactPayload, isSameOrigin(), json(), normalizedName(), POST(), remoteAddress(), text(), TurnstileResult (+18 more)

### Community 15 - "Project Entry Schema"
Cohesion: 0.18
Nodes (11): $ref, type, properties, categoryId, liveUrl, repositoryUrl, year, type (+3 more)

### Community 16 - "Experience Entry Schema"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Почему `$defs` стал мостом между частями модели данных, и является ли это проблемой?, Source Nodes

### Community 17 - "Profile Identity Schema"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Займемся формой на сайте: каков план?, Source Nodes

### Community 18 - "Graphify Workflow Guide"
Cohesion: 0.32
Nodes (8): Graphify Architecture Report, graphify explain, Graphify Knowledge Graph, graphify path, graphify query, graphify update, Graphify Wiki, Scoped Subgraph Navigation

### Community 19 - "skill"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: ну погнали, Source Nodes

### Community 20 - "Root Layout Typography"
Cohesion: 0.10
Nodes (38): geistMono, geistSans, generateMetadata(), RootLayout(), generateMetadata(), LocaleHome(), LocalePageProps, requireLocale() (+30 more)

### Community 21 - "Browser Window Icon"
Cohesion: 0.50
Nodes (5): Browser window icon, Gray #666 fill, Window SVG asset, Three title-bar control dots, Rounded window frame

### Community 22 - "sortOrder"
Cohesion: 0.22
Nodes (9): additionalProperties, properties, type, minLength, type, category, $ref, code (+1 more)

### Community 23 - "Security Headers"
Cohesion: 0.50
Nodes (3): contentSecurityPolicy, nextConfig, securityHeaders

### Community 24 - "File Document Icon"
Cohesion: 0.50
Nodes (4): 16×16 SVG view box, file.svg asset, Document file icon, Gray #666 fill

### Community 26 - "properties"
Cohesion: 0.17
Nodes (12): experience, minLength, type, additionalProperties, properties, end, sortOrder, start (+4 more)

### Community 27 - "Content Version Database"
Cohesion: 0.20
Nodes (10): minLength, type, additionalProperties, properties, type, clearance, profile, translations (+2 more)

### Community 30 - "Globe Icon Asset"
Cohesion: 1.00
Nodes (3): Globe SVG asset, 16 by 16 clipping region, Spherical globe with latitude and longitude bands

### Community 31 - "Vercel Icon Asset"
Cohesion: 1.00
Nodes (3): Vercel SVG asset, Vercel brand mark, White upward-pointing triangle

### Community 35 - "status"
Cohesion: 0.06
Nodes (42): required, required, localizedText, skill, type, required, maximum, minimum (+34 more)

### Community 41 - "Q: Fix the attached Vercel build failure where admin-publish-route tests call cookies outside a request scope."
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Fix the attached Vercel build failure where admin-publish-route tests call cookies outside a request scope., Source Nodes

### Community 42 - "Q: Почему локальные admin publish route tests снова прошли, а Vercel production build упал на cookies outside request scope?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Почему локальные admin publish route tests снова прошли, а Vercel production build упал на cookies outside request scope?, Source Nodes

### Community 43 - "Q: Нормальные миграции БД: выполнять миграции отдельной командой, вести таблицу применённых миграций и не запускать их при публикации. Объясни, что собираешься делать."
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Нормальные миграции БД: выполнять миграции отдельной командой, вести таблицу применённых миграций и не запускать их при публикации. Объясни, что собираешься делать., Source Nodes

### Community 44 - "year"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Реализовать нормальные миграции БД отдельной командой с таблицей применённых миграций и не запускать их при публикации., Source Nodes

### Community 45 - "Q: Единая серверная валидация: Повторно проверять публикуемый JSON на сервере либо выдавать подписанный одноразовый import-token. Что это значит и что будет сделано?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Единая серверная валидация: Повторно проверять публикуемый JSON на сервере либо выдавать подписанный одноразовый import-token. Что это значит и что будет сделано?, Source Nodes

### Community 46 - "translations"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: А там включено отображение embed для различных мессенджеров?, Source Nodes

### Community 47 - "spaceBackground.tsx"
Cohesion: 0.31
Nodes (11): buildFragmentSource(), compileShader(), createScene(), Scene, SpaceBackground(), adaptWebGlQuality(), createWebGlFpsState(), WEBGL_QUALITY_CONFIG (+3 more)

### Community 48 - "Q: > WebGL recovery`n> Обрабатывать webglcontextlost, показывать CSS-fallback и динамически снижать качество по фактическому FPS.`n`nпоясни, что ты хотел здесь сделать"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: > WebGL recovery`n> Обрабатывать webglcontextlost, показывать CSS-fallback и динамически снижать качество по фактическому FPS.`n`nпоясни, что ты хотел здесь сделать, Source Nodes

### Community 49 - "$defs"
Cohesion: 0.14
Nodes (14): properties, minLength, type, label, type, url, value, visible (+6 more)

### Community 51 - "properties"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Why does the Vercel build fail in the SEO robots and sitemap unit test?, Source Nodes

### Community 53 - "Q: давай"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: давай, Source Nodes

### Community 54 - "Q: Аудит действий админки: объясни, что ты хотел тут сделать"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Аудит действий админки: объясни, что ты хотел тут сделать, Source Nodes

### Community 56 - "Q: Переменная SITE_URL с fallback на https://nickraspy.dev. Поясни зачем это."
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Переменная SITE_URL с fallback на https://nickraspy.dev. Поясни зачем это., Source Nodes

### Community 57 - "Q: Если я не владею nickraspy.dev, будет ли сайт использовать этот адрес?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Если я не владею nickraspy.dev, будет ли сайт использовать этот адрес?, Source Nodes

### Community 58 - "002_content_audit_log.sql"
Cohesion: 0.67
Nodes (3): portfolio_content_audit_log, portfolio_content_audit_log_append_only, reject_portfolio_content_audit_mutation()

### Community 60 - "admin.ts"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: npm run dev fails with canonical site origin required, Source Nodes

### Community 61 - "$defs"
Cohesion: 0.17
Nodes (12): additionalProperties, type, $defs, contact, id, profileTranslations, project, pattern (+4 more)

### Community 63 - "status"
Cohesion: 0.29
Nodes (7): status, enum, minLength, type, archived, draft, published

### Community 64 - "Q: Why must localhost be removed from the SEO site origin?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Why must localhost be removed from the SEO site origin?, Source Nodes

### Community 65 - "Q: What causes Cloudflare Turnstile client error 110200 in the contact form?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: What causes Cloudflare Turnstile client error 110200 in the contact form?, Source Nodes

## Knowledge Gaps
- **300 isolated node(s):** `LocalePageProps`, `metadata`, `ValidatedImport`, `ContactPayload`, `TurnstileResult` (+295 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **12 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Work-memory lessons

**Preferred sources** — corroborated by past sessions; start here.
- `layout.tsx` (2× useful, score=1.997515225) _(code changed — re-verify)_
- `generateMetadata()` (2× useful, score=1.995107688) _(code changed — re-verify)_
- `WebGL HUD` (2× useful, score=1.990110188) _(code changed — re-verify)_
- `publishContent()` (2× useful, score=1.989711878)
- `repository.ts` (2× useful, score=1.788560448)
- `admin-publish-route.test.ts` (2× useful, score=1.664748999)
- `validatePortfolioContentForPublish()` (2× useful, score=1.663724604)

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `$defs` connect `$defs` to `properties`, `status`, `Required Schema Fields`, `sortOrder`?**
  _High betweenness centrality (0.139) - this node is a cross-community bridge._
- **Why does `properties` connect `Schema Collection Rules` to `Content Version Database`, `Required Schema Fields`?**
  _High betweenness centrality (0.057) - this node is a cross-community bridge._
- **Why does `text()` connect `Admin API Publishing` to `Skill Category Schema`?**
  _High betweenness centrality (0.047) - this node is a cross-community bridge._
- **What connects `LocalePageProps`, `metadata`, `ValidatedImport` to the rest of the system?**
  _300 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Admin API Publishing` be split into smaller, more focused modules?**
  _Cohesion score 0.08055152394775036 - nodes in this community are weakly interconnected._
- **Should `Schema Collection Rules` be split into smaller, more focused modules?**
  _Cohesion score 0.07007575757575757 - nodes in this community are weakly interconnected._
- **Should `Runtime Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.04878048780487805 - nodes in this community are weakly interconnected._