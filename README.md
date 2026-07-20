# Aetheris Portfolio

Next.js 16 portfolio with a WebGL HUD, versioned PostgreSQL content, an Excel import pipeline, and a protected publishing console.

## Local development

```powershell
npm install
npm run dev
```

The public portfolio is available at `http://localhost:3000`. The content console is available at `http://localhost:3000/admin`.

Without `DATABASE_URL`, the public page reads `content/fallback/portfolio.json` and the console stays in read-only validation mode.

For local admin UI development only:

```powershell
$env:ADMIN_DEV_BYPASS="true"
npm run dev
```

The bypass is ignored when `NODE_ENV=production`.

## Content workflow

The editable workbook is [outputs/portfolio-data/portfolio.xlsx](outputs/portfolio-data/portfolio.xlsx).

```powershell
# Validate the workbook without changing production.
npm run content:validate

# Create/update the PostgreSQL content tables.
npm run content:migrate

# Validate, publish a version, save latest.json, and revalidate the site.
npm run content:sync

# Inspect and restore published versions.
npm run content:history
npm run content:rollback -- <version-id>
```

The CLI accepts a custom workbook path:

```powershell
npm run content:validate -- D:\content\portfolio.xlsx
npm run content:sync -- D:\content\portfolio.xlsx
```

## PostgreSQL

The data model stores immutable JSONB snapshots in `portfolio_content_versions` and atomically points `portfolio_content_state` at the active version. The equivalent migration is in `database/001_content_versions.sql`; `content:migrate` applies it idempotently.

Copy `.env.example` to `.env.local` and set:

- `DATABASE_URL` — PostgreSQL connection string;
- `REVALIDATE_URL` — production `/api/revalidate` URL;
- `REVALIDATE_SECRET` — shared secret used after CLI publication.

## Admin authentication

Create a GitHub OAuth application and use this callback:

```text
https://your-domain.example/api/auth/github/callback
```

Configure `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `ADMIN_GITHUB_LOGIN`, and a random `AUTH_SECRET` of at least 32 characters in Vercel. Multiple allowed GitHub logins can be separated by commas.

## Verification

```powershell
npm run lint
npm run build
npm audit
```
