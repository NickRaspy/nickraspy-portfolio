"use client";

import { useRef, useState } from "react";
import type { ContentVersion } from "@/src/content/repository";
import type { ImportResult, PortfolioContent } from "@/src/content/types";
import { formatVersionTimestamp } from "@/src/content/formatVersionTimestamp";

type ValidatedImport = ImportResult & { content: PortfolioContent; checksum: string; sourceFilename: string };
const maxWorkbookBytes = 4 * 1024 * 1024;

function Icon({ name }: { name: "upload" | "check" | "history" | "database" | "logout" | "file" }) {
  const paths = {
    upload: <><path d="M12 16V4m0 0L7 9m5-5 5 5"/><path d="M5 14v5h14v-5"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    history: <><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l3 2"/></>,
    database: <><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/></>,
    logout: <><path d="M10 4H4v16h6M14 8l4 4-4 4M8 12h10"/></>,
    file: <><path d="M6 2h8l4 4v16H6zM14 2v5h5"/><path d="M9 12h6M9 16h6"/></>,
  };
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">{paths[name]}</svg>;
}

export default function AdminWorkbench({ sessionLogin, databaseReady, devBypass, initialVersions }: {
  sessionLogin: string;
  databaseReady: boolean;
  devBypass: boolean;
  initialVersions: ContentVersion[];
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<ValidatedImport | null>(null);
  const [issues, setIssues] = useState<ImportResult["issues"]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [versions, setVersions] = useState(initialVersions);

  async function validate(file?: File) {
    if (!file) return;
    if (file.size > maxWorkbookBytes) {
      setResult(null);
      setIssues([]);
      setMessage("Файл должен быть не больше 4 МБ.");
      return;
    }
    setPending(true);
    setMessage(null);
    setResult(null);
    setIssues([]);
    const form = new FormData();
    form.set("file", file);
    try {
      const response = await fetch("/api/admin/import/validate", { method: "POST", body: form });
      const payload = await response.json();
      if (!response.ok || !payload.content) {
        setIssues(payload.issues ?? []);
        setMessage(payload.error ?? "В файле найдены ошибки.");
        return;
      }
      setResult(payload);
      setIssues(payload.issues ?? []);
      setMessage("Файл прошёл проверку и готов к публикации.");
    } catch {
      setMessage("Не удалось связаться с сервером проверки.");
    } finally {
      setPending(false);
    }
  }

  async function refreshVersions() {
    const response = await fetch("/api/admin/versions", { cache: "no-store" });
    if (response.ok) setVersions((await response.json()).versions);
  }

  async function publish() {
    if (!result || !databaseReady) return;
    setPending(true);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/publish", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ content: result.content, sourceFilename: result.sourceFilename }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Публикация не удалась.");
      setMessage(`Версия ${payload.versionId.slice(0, 8)} опубликована. Кэш сайта обновляется.`);
      await refreshVersions();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Публикация не удалась.");
    } finally {
      setPending(false);
    }
  }

  async function rollback(versionId: string) {
    if (!window.confirm("Сделать эту версию активной?")) return;
    setPending(true);
    const response = await fetch("/api/admin/rollback", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ versionId }),
    });
    const payload = await response.json();
    setMessage(response.ok ? `Активирована версия ${versionId.slice(0, 8)}.` : payload.error ?? "Откат не удался.");
    await refreshVersions();
    setPending(false);
  }

  return <main className="admin-shell">
    <div className="admin-stars" aria-hidden="true" />
    <header className="admin-topbar">
      <div className="admin-brand"><span><Icon name="database" /></span><div><small>AETHERIS // DATA NODE</small><strong>CONTENT CONTROL</strong></div></div>
      <div className="admin-session"><span>{devBypass ? "LOCAL_BYPASS" : sessionLogin}</span><i aria-hidden="true" /><form action="/api/auth/logout" method="post"><button aria-label="Выйти"><Icon name="logout" /></button></form></div>
    </header>

    <div className="admin-layout">
      <aside className="admin-sidebar" aria-label="Состояние системы">
        <p>PIPELINE_STATUS</p>
        <div className="admin-status"><Icon name="database" /><span><small>POSTGRESQL</small><strong className={databaseReady ? "online" : "offline"}>{databaseReady ? "CONNECTED" : "NOT_CONFIGURED"}</strong></span></div>
        <div className="admin-status"><Icon name="check" /><span><small>VALIDATOR</small><strong className="online">READY</strong></span></div>
        <div className="admin-status"><Icon name="history" /><span><small>VERSIONS</small><strong>{versions.length}</strong></span></div>
        {!databaseReady && <div className="admin-notice"><strong>READ_ONLY_MODE</strong><span>Проверка Excel доступна. Для публикации добавь DATABASE_URL.</span></div>}
      </aside>

      <section className="admin-content">
        <div className="admin-heading"><div><p>IMPORT_SEQUENCE // 01</p><h1>Загрузка контента</h1></div><a href="/" target="_blank" rel="noreferrer">Открыть портфолио ↗</a></div>

        <div
          className={`admin-dropzone ${dragging ? "dragging" : ""}`}
          onDragEnter={(event) => { event.preventDefault(); setDragging(true); }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => { event.preventDefault(); setDragging(false); void validate(event.dataTransfer.files[0]); }}
        >
          <input ref={inputRef} type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={(event) => void validate(event.target.files?.[0])} />
          <span className="admin-upload-icon"><Icon name="upload" /></span>
          <h2>{pending ? "Проверяю структуру…" : "Перетащи portfolio.xlsx"}</h2>
          <p>или выбери файл вручную · максимум 4 МБ</p>
          <button type="button" disabled={pending} onClick={() => inputRef.current?.click()}>{pending ? "VALIDATING…" : "SELECT_WORKBOOK"}</button>
        </div>

        {message && <div className={`admin-feedback ${result ? "success" : ""}`} role="status">{message}</div>}

        {issues.length > 0 && <section className="admin-panel" aria-labelledby="issues-title">
          <div className="admin-panel-title"><span><Icon name="file" /></span><div><small>VALIDATION_REPORT</small><h2 id="issues-title">Нужно исправить</h2></div></div>
          <ul className="admin-issues">{issues.map((issue, index) => <li key={`${issue.sheet}-${issue.row}-${index}`}><code>{issue.sheet}{issue.row ? `:${issue.row}` : ""}</code><span>{issue.message}</span></li>)}</ul>
        </section>}

        {result && <section className="admin-panel" aria-labelledby="preview-title">
          <div className="admin-panel-title"><span><Icon name="check" /></span><div><small>IMPORT_PREVIEW</small><h2 id="preview-title">{result.sourceFilename}</h2></div></div>
          <div className="admin-metrics">
            {Object.entries(result.summary).map(([label, value]) => <div key={label}><small>{label}</small><strong>{value}</strong></div>)}
          </div>
          <div className="admin-project-preview">{result.content.projects.slice(0, 5).map((project) => <article key={project.id}><code>{project.id}</code><div><strong>{project.translations[result.content.defaultLocale]?.name}</strong><span>{project.categoryId} · {project.status} · {project.year}</span></div></article>)}</div>
          <div className="admin-publish-row"><span>SHA-256 · {result.checksum.slice(0, 16)}</span><button className="admin-primary" type="button" disabled={pending || !databaseReady} onClick={() => void publish()}>{pending ? "PUBLISHING…" : "PUBLISH_VERSION"}</button></div>
        </section>}

        <section className="admin-panel" aria-labelledby="history-title">
          <div className="admin-panel-title"><span><Icon name="history" /></span><div><small>VERSION_LEDGER</small><h2 id="history-title">История публикаций</h2></div></div>
          {versions.length === 0 ? <p className="admin-empty">Опубликованных версий пока нет.</p> : <div className="admin-history">{versions.map((version) => <article key={version.id} className={version.active ? "active" : ""}><div><code>{version.id.slice(0, 8)}</code><strong>{version.sourceFilename}</strong><span>{formatVersionTimestamp(version.createdAt)} · {version.createdBy}</span></div>{version.active ? <b>ACTIVE</b> : <button disabled={pending} onClick={() => void rollback(version.id)}>RESTORE</button>}</article>)}</div>}
        </section>
      </section>
    </div>
  </main>;
}
