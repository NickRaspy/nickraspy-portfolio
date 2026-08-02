"use client";

import { useCallback, useMemo, useRef, useState, type FormEvent, type PointerEvent as ReactPointerEvent } from "react";
import type { PortfolioView } from "@/src/content/types";
import { locales, type SupportedLocale } from "@/src/i18n/config";
import { messages } from "@/src/i18n/messages";
import TurnstileWidget from "./turnstileWidget";
import SpaceBackground from "./spaceBackground";
import "./hudPortfolio.css";

type Tab = "about" | "log" | "projects" | "contact";
type Project = PortfolioView["projects"][number];
type WindowKey = "about" | "log" | "projects-category" | "projects-list" | "projects-detail" | "contact";
type Point = { x: number; y: number };

function Glyph({ type }: { type: Tab | "arrow" | "back" }) {
  const paths = {
    about: <><circle cx="12" cy="8" r="3"/><path d="M5 20v-2a7 7 0 0 1 14 0v2M4 4h2M4 4v2M20 4h-2M20 4v2"/></>,
    log: <><rect x="6" y="6" width="12" height="12"/><path d="M9 1v3M15 1v3M9 20v3M15 20v3M1 9h3M1 15h3M20 9h3M20 15h3M10 10h4v4h-4z"/></>,
    projects: <><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9zM4 7.5l8 4.5 8-4.5M12 12v9"/></>,
    contact: <><path d="m5 7 4 5-4 5M11 17h8M3 3h18v18H3z"/></>,
    arrow: <path d="M5 12h14M14 7l5 5-5 5"/>,
    back: <path d="M19 12H5M10 7l-5 5 5 5"/>,
  };
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">{paths[type]}</svg>;
}

function Panel({ title, id, children, onPointerDown, offset, className = "" }: { title: string; id: string; children: React.ReactNode; onPointerDown: (e: ReactPointerEvent<HTMLDivElement>) => void; offset: Point; className?: string }) {
  return <section className={`hud-panel ${className}`} aria-labelledby={`hud-${id}`} style={{ transform: `translate3d(${offset.x}px,${offset.y}px,0)` }}>
    <div className="hud-header" onPointerDown={onPointerDown}><h2 id={`hud-${id}`}>{title}</h2><span>ID:{id}</span></div>
    {children}
  </section>;
}

export default function HudPortfolio({ data, locale }: { data: PortfolioView; locale: SupportedLocale }) {
  const t = messages[locale];
  const [tab, setTab] = useState<Tab>("about");
  const [category, setCategory] = useState<string | null>(null);
  const [selected, setSelected] = useState<Project | null>(null);
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [formError, setFormError] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileReset, setTurnstileReset] = useState(0);
  const [offsets, setOffsets] = useState<Partial<Record<WindowKey, Point>>>({});
  const stageRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ key: WindowKey; x: number; y: number; ox: number; oy: number; minX: number; maxX: number; minY: number; maxY: number } | null>(null);
  const projects = useMemo(() => data.projects.reduce<Record<string, Project[]>>((groups, project) => {
    (groups[project.categoryId] ??= []).push(project);
    return groups;
  }, {}), [data.projects]);
  const technologyTags = useMemo(() => [...new Set(data.projects.flatMap((project) => project.tags))].slice(0, 3), [data.projects]);
  const selectedCategory = data.categories.find((item) => item.id === category);
  const receiveTurnstileToken = useCallback((token: string) => setTurnstileToken(token), []);

  const submitContact = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (sending) return;
    if (!turnstileToken) {
      setFormError(t.contact.verificationPending);
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);
    setSending(true);
    setFormError("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          email: formData.get("email"),
          message: formData.get("message"),
          website: formData.get("website"),
          turnstileToken,
        }),
      });
      const result = (await response.json().catch(() => null)) as { ok?: boolean; code?: string } | null;

      if (!response.ok || !result?.ok) {
        const retryVerification = result?.code === "VERIFICATION_FAILED" || result?.code === "VERIFICATION_REQUIRED";
        setFormError(
          retryVerification
            ? t.contact.verificationFailed
            : result?.code === "INVALID_FIELDS"
              ? t.contact.invalidPayload
              : t.contact.transferFailed,
        );
        return;
      }

      form.reset();
      setSent(true);
    } catch {
      setFormError(t.contact.connectionLost);
    } finally {
      setSending(false);
      setTurnstileReset((value) => value + 1);
    }
  };

  const dragStart = (key: WindowKey) => (event: ReactPointerEvent<HTMLDivElement>) => {
    if (window.innerWidth < 768 || (event.target as HTMLElement).closest("button,input,textarea")) return;
    const panel = event.currentTarget.closest<HTMLElement>(".hud-panel");
    const stage = stageRef.current;
    if (!panel || !stage) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const offset = offsets[key] ?? { x: 0, y: 0 };
    const panelRect = panel.getBoundingClientRect();
    const stageRect = stage.getBoundingClientRect();
    const stageStyle = window.getComputedStyle(stage);
    const left = stageRect.left + parseFloat(stageStyle.paddingLeft);
    const right = stageRect.right - parseFloat(stageStyle.paddingRight);
    const top = stageRect.top + parseFloat(stageStyle.paddingTop);
    const bottom = stageRect.bottom - parseFloat(stageStyle.paddingBottom);
    const rawMinX = offset.x + left - panelRect.left;
    const rawMaxX = offset.x + right - panelRect.right;
    const rawMinY = offset.y + top - panelRect.top;
    const rawMaxY = offset.y + bottom - panelRect.bottom;
    const centerX = (rawMinX + rawMaxX) / 2;
    const centerY = (rawMinY + rawMaxY) / 2;
    drag.current = {
      key,
      x: event.clientX,
      y: event.clientY,
      ox: offset.x,
      oy: offset.y,
      minX: rawMinX <= rawMaxX ? rawMinX : centerX,
      maxX: rawMinX <= rawMaxX ? rawMaxX : centerX,
      minY: rawMinY <= rawMaxY ? rawMinY : centerY,
      maxY: rawMinY <= rawMaxY ? rawMaxY : centerY,
    };
  };
  const dragMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    const activeDrag = drag.current;
    const next = {
      x: Math.max(activeDrag.minX, Math.min(activeDrag.maxX, activeDrag.ox + event.clientX - activeDrag.x)),
      y: Math.max(activeDrag.minY, Math.min(activeDrag.maxY, activeDrag.oy + event.clientY - activeDrag.y)),
    };
    setOffsets(current => ({ ...current, [activeDrag.key]: next }));
  };
  const switchTab = (next: Tab) => { setTab(next); setCategory(null); setSelected(null); setOffsets({}); };

  return <div className="hud-ui" onPointerMove={dragMove} onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }}>
    <SpaceBackground />
    <div className="scanlines" aria-hidden="true" />
    <div className="reticle reticle-a" aria-hidden="true" /><div className="reticle reticle-b" aria-hidden="true" />
    <nav className="language-switcher" aria-label={t.languageSwitcher}>
      {locales.map((nextLocale) => <a
        key={nextLocale}
        className={locale === nextLocale ? "active" : ""}
        href={`/${nextLocale}?setLocale=${nextLocale}`}
        hrefLang={nextLocale}
        lang={nextLocale}
        aria-label={t.languages[nextLocale]}
        aria-current={locale === nextLocale ? "page" : undefined}
      >{nextLocale.toUpperCase()}</a>)}
    </nav>
    <div ref={stageRef} className="hud-stage"><div className="hud-anchor">
      {tab === "about" && <Panel title={t.panels.profile} id="001" onPointerDown={dragStart("about")} offset={offsets.about ?? { x: 0, y: 0 }}>
        <div className="profile"><div className="avatar"><Glyph type="about" /></div><div><small>{t.labels.designation}</small><h3>{data.profile.role}</h3></div></div>
        <p>{data.profile.summary}</p>
        <div className="stats"><div><small>{t.labels.status}</small><strong>{t.profileValues[data.profile.status] ?? data.profile.status}</strong></div><div><small>{t.labels.clearance}</small><strong>{t.profileValues[data.profile.clearance] ?? data.profile.clearance}</strong></div></div>
      </Panel>}
      {tab === "log" && <Panel title={t.panels.experience} id="002" onPointerDown={dragStart("log")} offset={offsets.log ?? { x: 0, y: 0 }} className="log-panel"><div className="log-grid"><div><label>{t.labels.technicalSpecs}</label>{data.skills.map((skill) => <div className="meter" key={skill.id}><div><span>{skill.name}</span><b>{skill.level}%</b></div><i><em style={{ width: `${skill.level}%` }} /></i></div>)}<div className="tags">{technologyTags.map((tag) => <span key={tag}>{tag}</span>)}</div></div><div className="timeline"><label>{t.labels.systemLog}</label>{data.experience.map((item) => <div key={item.id}><time>{item.range}</time><b>{item.role}</b></div>)}</div></div></Panel>}
      {tab === "projects" && <div className="project-grid">
        <Panel title={t.panels.projects} id="003" onPointerDown={dragStart("projects-category")} offset={offsets["projects-category"] ?? { x: 0, y: 0 }}><label>{t.labels.selectSector}</label>{data.categories.map((item) => <button className={`sector ${category === item.id ? "active" : ""}`} key={item.id} onClick={() => { setCategory(item.id); setSelected(null); }}><span><b>{item.name}</b><small>{item.code}</small></span><Glyph type="arrow" /></button>)}</Panel>
        {category && <Panel title={(selectedCategory?.name ?? category).toUpperCase()} id="003-L" onPointerDown={dragStart("projects-list")} offset={offsets["projects-list"] ?? { x: 0, y: 0 }} className="list-panel"><button className="mobile-back" aria-label={t.project.backToSectors} onClick={() => setCategory(null)}><Glyph type="back" /></button>{(projects[category] ?? []).map(project => <button className={`project-row ${selected?.id === project.id ? "active" : ""}`} key={project.id} onClick={() => setSelected(project)}><small>{project.code}</small><span>{project.name}</span><Glyph type="arrow" /></button>)}</Panel>}
        {selected && <Panel title={t.panels.projectMetadata} id="003-D" onPointerDown={dragStart("projects-detail")} offset={offsets["projects-detail"] ?? { x: 0, y: 0 }} className="detail-panel"><button className="mobile-back" aria-label={t.project.backToProjects} onClick={() => setSelected(null)}><Glyph type="back" /></button><div className="project-visual"><Glyph type="projects" /><span>{selected.code}</span></div><h3>{selected.name}</h3><p>{selected.description}</p><div className="tags">{selected.tags.map(tag => <span key={tag}>{tag}</span>)}</div>{selected.liveUrl ? <a className="hud-action" href={selected.liveUrl} target="_blank" rel="noreferrer">{t.project.openLive}</a> : <button className="hud-action" disabled>{t.project.linkUnavailable}</button>}</Panel>}
      </div>}
      {tab === "contact" && <Panel title={t.panels.contact} id="004" onPointerDown={dragStart("contact")} offset={offsets.contact ?? { x: 0, y: 0 }} className="contact-panel">{sent ? <div className="success"><Glyph type="contact"/><b>{t.contact.success}</b><p>{t.contact.successDescription}</p><button onClick={() => { setSent(false); setFormError(""); }}>{t.contact.newTransmission}</button></div> : <form onSubmit={submitContact}><label>{t.contact.name}<input name="name" required minLength={2} maxLength={80} autoComplete="name" placeholder={t.contact.namePlaceholder} /></label><label>{t.contact.email}<input name="email" required maxLength={254} type="email" autoComplete="email" placeholder={t.contact.emailPlaceholder} /></label><label>{t.contact.message}<textarea name="message" required minLength={10} maxLength={4000} placeholder={t.contact.messagePlaceholder} /></label><label className="signal-trap" aria-hidden="true">{t.contact.website}<input name="website" tabIndex={-1} autoComplete="off" /></label><TurnstileWidget onToken={receiveTurnstileToken} resetSignal={turnstileReset} />{formError && <p className="form-feedback error" role="alert">{formError}</p>}<button className="hud-action" disabled={sending || !turnstileToken}>{sending ? t.contact.submitting : t.contact.submit}</button></form>}</Panel>}
    </div></div>
    <nav className="hud-dock" aria-label={t.sectionsNavigation}>{(["about","log","projects","contact"] as Tab[]).map(item => <button key={item} className={tab === item ? "active" : ""} aria-current={tab === item ? "page" : undefined} onClick={() => switchTab(item)}><Glyph type={item}/><span>{t.dock[item]}</span></button>)}</nav>
  </div>;
}
