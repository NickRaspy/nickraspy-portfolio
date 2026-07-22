import type { Metadata } from "next";
import Link from "next/link";
import { getAdminSession, isGitHubAuthConfigured, isLocalAdminBypass } from "@/src/auth/admin";
import { hasDatabase, listContentVersions } from "@/src/content/repository";
import AdminWorkbench from "./workbench";
import "./admin.css";

export const metadata: Metadata = {
  title: "Content Control // Aetheris",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

function Mark() {
  return <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 2 21 7v10l-9 5-9-5V7zM3 7l9 5 9-5M12 12v10"/></svg>;
}

export default async function AdminPage() {
  const session = await getAdminSession();
  if (!session) {
    const configured = isGitHubAuthConfigured();
    return <main className="admin-shell admin-login">
      <div className="admin-stars" aria-hidden="true" />
      <section className="admin-login-card" aria-labelledby="admin-login-title">
        <div className="admin-brand"><span><Mark /></span><div><small>AETHERIS // SECURE NODE</small><strong>CONTENT CONTROL</strong></div></div>
        <p className="admin-kicker">AUTHORIZATION REQUIRED</p>
        <h1 id="admin-login-title">Панель публикации портфолио</h1>
        <p>Доступ разрешён только GitHub-аккаунтам из production allowlist.</p>
        {configured
          ? <a className="admin-primary" href="/api/auth/github">Войти через GitHub</a>
          : <div className="admin-notice" role="status"><strong>AUTH_OFFLINE</strong><span>Заполни GitHub OAuth-переменные из .env.example.</span></div>}
        <Link className="admin-secondary" href="/">Вернуться на сайт</Link>
      </section>
    </main>;
  }

  const databaseReady = hasDatabase();
  const versions = databaseReady ? await listContentVersions(30) : [];
  return <AdminWorkbench
    sessionLogin={session.login}
    databaseReady={databaseReady}
    devBypass={isLocalAdminBypass()}
    initialVersions={versions}
  />;
}
