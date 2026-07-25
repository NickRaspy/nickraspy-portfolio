# Graph Report - nickraspy-portfolio  (2026-07-26)

## Corpus Check
- 52 files · ~15,780 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 525 nodes · 747 edges · 37 communities (28 shown, 9 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 6 edges (avg confidence: 0.91)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1a2efcb1`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Portfolio Schema Core
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
- Root Layout Typography
- Browser Window Icon
- Security Headers
- File Document Icon
- Revalidation Endpoint
- Content Version Database
- Legacy Cosmic Gas
- Legacy Starfield Rendering
- Globe Icon Asset
- Vercel Icon Asset
- ESLint Configuration
- PostCSS Configuration
- Next.js Icon Asset
- vercel.json
- playwright.config.ts

## God Nodes (most connected - your core abstractions)
1. `scripts` - 17 edges
2. `importPortfolioWorkbook()` - 16 edges
3. `compilerOptions` - 16 edges
4. `getAdminSession()` - 11 edges
5. `authorizeAdminMutation()` - 11 edges
6. `required` - 10 edges
7. `POST()` - 9 edges
8. `$defs` - 9 edges
9. `listContentVersions()` - 9 edges
10. `required` - 8 edges

## Surprising Connections (you probably didn't know these)
- `AdminPage()` --calls--> `isGitHubAuthConfigured()`  [EXTRACTED]
  app/admin/page.tsx → src/auth/admin.ts
- `POST()` --calls--> `authorizeAdminMutation()`  [EXTRACTED]
  app/api/admin/publish/route.ts → src/auth/request.ts
- `POST()` --calls--> `validatePortfolioContentForPublish()`  [EXTRACTED]
  app/api/admin/publish/route.ts → src/content/importer.ts
- `POST()` --calls--> `authorizeAdminMutation()`  [EXTRACTED]
  app/api/admin/rollback/route.ts → src/auth/request.ts
- `Home()` --calls--> `getPortfolioView()`  [EXTRACTED]
  app/page.tsx → src/content/data.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Aetheris Technical Architecture** — readme_nextjs_16, readme_webgl_hud, readme_postgresql_content, readme_excel_import_pipeline, readme_admin_console [EXTRACTED 1.00]
- **Portfolio Content Workflow** — readme_portfolio_workbook, readme_content_validate, readme_content_migrate, readme_content_sync, readme_content_history, readme_content_rollback [EXTRACTED 1.00]
- **GitHub Admin Security** — readme_github_oauth, readme_immutable_github_id_allowlist, readme_auth_origin, readme_oauth_pkce, readme_secure_admin_cookies [EXTRACTED 1.00]

## Communities (37 total, 9 thin omitted)

### Community 0 - "Portfolio Schema Core"
Cohesion: 0.09
Nodes (21): additionalProperties, $defs, id, profileTranslations, $id, pattern, type, type (+13 more)

### Community 1 - "Admin API Publishing"
Cohesion: 0.14
Nodes (23): AdminPage(), metadata, AdminWorkbench(), ValidatedImport, POST(), POST(), GET(), loadWorkbook() (+15 more)

### Community 2 - "Schema Collection Rules"
Cohesion: 0.11
Nodes (21): items, type, items, type, minLength, type, items, $ref (+13 more)

### Community 3 - "Runtime Dependencies"
Cohesion: 0.05
Nodes (36): ajv, next, dependencies, ajv, next, postgres, react, react-dom (+28 more)

### Community 4 - "TypeScript Build Configuration"
Cohesion: 0.07
Nodes (28): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+20 more)

### Community 5 - "Portfolio HUD Interface"
Cohesion: 0.15
Nodes (6): Point, Project, Tab, WindowKey, TurnstileApi, Window

### Community 6 - "Required Schema Fields"
Cohesion: 0.06
Nodes (42): required, required, localizedText, skill, type, required, maximum, minimum (+34 more)

### Community 7 - "Content Operations Documentation"
Cohesion: 0.09
Nodes (23): Atomic Active Content Pointer, Protected Publishing Console, Local Admin Development Bypass, Aetheris Portfolio, Deployment Authentication Origin, Content History Command, Content Migration Command, Content Rollback Command (+15 more)

### Community 8 - "GitHub OAuth Security"
Cohesion: 0.14
Nodes (25): POST(), adminRedirect(), GET(), GET(), POST(), AdminSession, clearAdminSession(), consumeOAuthAttempt() (+17 more)

### Community 9 - "Excel Import Validation"
Cohesion: 0.11
Nodes (29): Home(), getCachedContent, getPortfolioView(), addIssue(), ajv, boolean(), ensureUnique(), importPortfolioWorkbook() (+21 more)

### Community 10 - "Development Tooling"
Cohesion: 0.09
Nodes (23): eslint, eslint-config-next, fflate, devDependencies, eslint, eslint-config-next, fflate, @playwright/test (+15 more)

### Community 11 - "Experience Translation Schema"
Cohesion: 0.14
Nodes (17): additionalProperties, properties, $ref, required, type, additionalProperties, company, role (+9 more)

### Community 12 - "Contact Translation Schema"
Cohesion: 0.04
Nodes (49): additionalProperties, properties, type, minLength, type, minLength, type, additionalProperties (+41 more)

### Community 13 - "Legacy Nebula Rendering"
Cohesion: 0.32
Nodes (10): Nebula(), Props, clamp(), createNoise2D(), createValueNoise2D(), hexToRgb(), lerp(), mixRgb() (+2 more)

### Community 14 - "Skill Category Schema"
Cohesion: 0.11
Nodes (26): ContactPayload, isSameOrigin(), json(), normalizedName(), POST(), remoteAddress(), text(), TurnstileResult (+18 more)

### Community 15 - "Project Entry Schema"
Cohesion: 0.06
Nodes (32): $ref, project, minLength, type, type, items, minItems, type (+24 more)

### Community 16 - "Experience Entry Schema"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Почему `$defs` стал мостом между частями модели данных, и является ли это проблемой?, Source Nodes

### Community 17 - "Profile Identity Schema"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Займемся формой на сайте: каков план?, Source Nodes

### Community 18 - "Graphify Workflow Guide"
Cohesion: 0.32
Nodes (8): Graphify Architecture Report, graphify explain, Graphify Knowledge Graph, graphify path, graphify query, graphify update, Graphify Wiki, Scoped Subgraph Navigation

### Community 20 - "Root Layout Typography"
Cohesion: 0.40
Nodes (3): geistMono, geistSans, metadata

### Community 21 - "Browser Window Icon"
Cohesion: 0.50
Nodes (5): Browser window icon, Gray #666 fill, Window SVG asset, Three title-bar control dots, Rounded window frame

### Community 23 - "Security Headers"
Cohesion: 0.50
Nodes (3): contentSecurityPolicy, nextConfig, securityHeaders

### Community 24 - "File Document Icon"
Cohesion: 0.50
Nodes (4): 16×16 SVG view box, file.svg asset, Document file icon, Gray #666 fill

### Community 30 - "Globe Icon Asset"
Cohesion: 1.00
Nodes (3): Globe SVG asset, 16 by 16 clipping region, Spherical globe with latitude and longitude bands

### Community 31 - "Vercel Icon Asset"
Cohesion: 1.00
Nodes (3): Vercel SVG asset, Vercel brand mark, White upward-pointing triangle

## Knowledge Gaps
- **230 isolated node(s):** `metadata`, `ValidatedImport`, `ContactPayload`, `TurnstileResult`, `geistSans` (+225 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `$defs` connect `Portfolio Schema Core` to `Contact Translation Schema`, `Required Schema Fields`, `Project Entry Schema`?**
  _High betweenness centrality (0.175) - this node is a cross-community bridge._
- **Why does `properties` connect `Schema Collection Rules` to `Portfolio Schema Core`, `Contact Translation Schema`, `Project Entry Schema`?**
  _High betweenness centrality (0.078) - this node is a cross-community bridge._
- **Why does `text()` connect `Excel Import Validation` to `Skill Category Schema`?**
  _High betweenness centrality (0.068) - this node is a cross-community bridge._
- **What connects `metadata`, `ValidatedImport`, `ContactPayload` to the rest of the system?**
  _230 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Portfolio Schema Core` be split into smaller, more focused modules?**
  _Cohesion score 0.09090909090909091 - nodes in this community are weakly interconnected._
- **Should `Admin API Publishing` be split into smaller, more focused modules?**
  _Cohesion score 0.1431451612903226 - nodes in this community are weakly interconnected._
- **Should `Schema Collection Rules` be split into smaller, more focused modules?**
  _Cohesion score 0.11428571428571428 - nodes in this community are weakly interconnected._