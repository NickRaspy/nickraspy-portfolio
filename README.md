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

Configure `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `ADMIN_GITHUB_ID`, `AUTH_ORIGIN`, and a random `AUTH_SECRET` of at least 32 characters in Vercel.

- `ADMIN_GITHUB_ID` is the immutable numeric GitHub account ID. Multiple allowed IDs can be separated by commas. NickRaspy is `90720459`.
- `AUTH_ORIGIN` is the exact public origin for this deployment, for example `https://portfolio-data.example.vercel.app`, without a path or trailing slash. Its `/api/auth/github/callback` URL must match the callback configured in the GitHub OAuth app.
- OAuth state, PKCE verifier, and the signed admin session are stored only in `HttpOnly`, `Secure`, host-only cookies in production.

## Contact form

The public contact form validates input on the server, uses a hidden honeypot field, and verifies a single-use Cloudflare Turnstile token. It sends a Telegram notification first and falls back to Resend if Telegram is unavailable.

Configure these variables in both Vercel Preview and Production:

- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` — the public site key of a Turnstile Managed widget;
- `TURNSTILE_SECRET_KEY` — the matching private Turnstile secret;
- `TELEGRAM_BOT_TOKEN` — the private token issued by BotFather;
- `TELEGRAM_CHAT_ID` — the Telegram chat that receives notifications;
- `RESEND_API_KEY` — a Resend API key with sending access for fallback delivery;
- `CONTACT_FROM_EMAIL` — the fallback sender, which must be accepted by Resend;
- `CONTACT_TO_EMAIL` — the private fallback inbox.

To find your private chat ID without sharing the bot token:

1. Put `TELEGRAM_BOT_TOKEN` in `.env.local`.
2. Open the bot in Telegram, press **Start**, and send it any message.
3. Run `npm run telegram:chats`.
4. Copy the displayed `chatId` into `TELEGRAM_CHAT_ID` in `.env.local`.

Local development uses Cloudflare's official always-pass test keys when the two Turnstile variables are absent. Telegram and Resend are independent delivery channels: at least one must be fully configured, and Resend is used only if Telegram does not deliver. Production fails closed when no configured channel can deliver the message.

## Verification

```powershell
npm run lint
npm run build
npm audit
```
