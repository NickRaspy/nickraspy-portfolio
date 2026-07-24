"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type PointerEvent as ReactPointerEvent } from "react";
import type { PortfolioView } from "@/src/content/types";
import TurnstileWidget from "./turnstileWidget";
import "./hudPortfolio.css";

type Tab = "about" | "log" | "projects" | "contact";
type Project = PortfolioView["projects"][number];
type WindowKey = "about" | "log" | "projects-category" | "projects-list" | "projects-detail" | "contact";
type Point = { x: number; y: number };

function SpaceBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const gl = canvas?.getContext("webgl", { antialias: false, alpha: false });
    if (!canvas || !gl) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const lowPower = window.matchMedia("(max-width: 767px), (pointer: coarse)").matches;
    const highPrecision = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT);
    const floatPrecision = highPrecision?.precision ? "highp" : "mediump";
    let frame = 0;
    let active = true;
    const vertexSource = `attribute vec2 position;void main(){gl_Position=vec4(position,0.0,1.0);}`;
    const hashSource = lowPower
      ? `float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}`
      : `float hash(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}`;
    const starSource = lowPower ? `
        vec2 tunnelUv=uv-vec2(0.0,0.02);
        float tunnelRadius=max(length(tunnelUv),0.018);
        float tunnelAngle=(atan(tunnelUv.y,tunnelUv.x)+3.14159265)/6.2831853;

        vec2 starUvA=vec2(tunnelAngle*96.0,log(tunnelRadius+0.075)*11.0-time*12.0);
        vec2 cellA=floor(starUvA);
        vec2 localA=fract(starUvA)-0.5;
        float seedA=hash(cellA);
        float radiusA=mix(0.075,0.115,hash(cellA+vec2(3.7,8.1)));
        float starA=(1.0-smoothstep(0.0,radiusA,length(vec2(localA.x*1.9,localA.y*0.34))))*step(0.972,seedA);

        vec2 starUvB=vec2(tunnelAngle*148.0,log(tunnelRadius+0.045)*15.0-time*15.0);
        vec2 cellB=floor(starUvB);
        vec2 localB=fract(starUvB)-0.5;
        float seedB=hash(cellB);
        float radiusB=mix(0.055,0.09,hash(cellB+vec2(6.2,1.9)));
        float starB=(1.0-smoothstep(0.0,radiusB,length(vec2(localB.x*2.1,localB.y*0.3))))*step(0.982,seedB);

        float tunnelFade=smoothstep(0.035,0.2,tunnelRadius)*(1.0-smoothstep(0.95,1.65,tunnelRadius));
        vec3 tintA=mix(vec3(0.62,0.88,1.0),vec3(1.0,0.88,0.62),hash(cellA+vec2(4.3,1.7)));
        vec3 stars=(tintA*starA+vec3(0.72,0.9,1.0)*starB*0.78)*tunnelFade;
      ` : `
        vec3 stars=vec3(0.0);
        for(float i=0.0;i<64.0;i+=1.0){
          float seed=hash(vec2(i*7.17,i*3.91));
          float life=fract(seed+time*(0.25+hash(vec2(i,9.4))*0.20));
          float angle=hash(vec2(i*2.31,5.73))*6.2831853;
          vec2 direction=vec2(cos(angle),sin(angle));
          float radius=pow(life,1.7)*(1.15+hash(vec2(i,2.8))*0.85);
          vec2 starPosition=direction*radius;
          float size=mix(0.0012,0.0042,life);
          vec2 starDelta=uv-starPosition;
          vec2 tangent=vec2(-direction.y,direction.x);
          float lateralOffset=dot(starDelta,tangent);
          float radialOffset=dot(starDelta,direction);
          float streakScale=mix(0.58,0.28,life);
          float dotStar=smoothstep(size,0.0,length(vec2(lateralOffset*1.45,radialOffset*streakScale)));
          float fade=smoothstep(0.0,0.12,life)*smoothstep(1.0,0.72,life);
          vec3 starTint=mix(vec3(0.62,0.88,1.0),vec3(1.0,0.88,0.62),hash(vec2(i,1.2)));
          stars+=starTint*dotStar*fade*(0.55+life*0.8);
        }
      `;
    const fragmentSource = `
      precision ${floatPrecision} float;
      uniform vec2 resolution;
      uniform float time;
      ${hashSource}
      float noise(vec2 p){vec2 i=floor(p);vec2 f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hash(i),hash(i+vec2(1.0,0.0)),f.x),mix(hash(i+vec2(0.0,1.0)),hash(i+vec2(1.0,1.0)),f.x),f.y);}
      float fbm(vec2 p){float v=0.0;float a=0.5;mat2 rot=mat2(0.866,-0.5,0.5,0.866);for(int i=0;i<${lowPower ? 3 : 5};++i){v+=a*noise(p);p=rot*p*2.0;a*=0.5;}return v;}
      void main(){
        vec2 uv=(gl_FragCoord.xy-0.5*resolution.xy)/resolution.y;
        float t=time*0.035;
        float q=fbm(uv*2.0-t*0.14);
        vec2 r=vec2(fbm(uv+q+t*0.07),fbm(uv+q-t*0.1));
        float f=fbm(uv+r*1.5);
        vec3 purple=vec3(0.08,0.01,0.15);
        vec3 blue=vec3(0.0,0.05,0.15);
        vec3 gold=vec3(0.15,0.10,0.05);
        vec3 color=mix(vec3(0.001,0.003,0.008),purple,clamp(q*1.2,0.0,1.0));
        color=mix(color,blue,clamp(r.x*1.3,0.0,1.0));
        color=mix(color,gold,clamp(r.y*f,0.0,1.0)*0.32);
        ${starSource}
        gl_FragColor=vec4(color*0.78+stars,1.0);
      }`;
    const compile = (source: string, type: number) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source); gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) { console.error(gl.getShaderInfoLog(shader)); gl.deleteShader(shader); return null; }
      return shader;
    };
    const vertex = compile(vertexSource, gl.VERTEX_SHADER);
    const fragment = compile(fragmentSource, gl.FRAGMENT_SHADER);
    if (!vertex || !fragment) return;
    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertex); gl.attachShader(program, fragment); gl.linkProgram(program); gl.useProgram(program);
    const buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buffer); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, "position"); gl.enableVertexAttribArray(position); gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    const resolution = gl.getUniformLocation(program, "resolution");
    const time = gl.getUniformLocation(program, "time");
    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, lowPower ? 0.75 : 1.5);
      canvas.width = Math.floor(window.innerWidth * ratio); canvas.height = Math.floor(window.innerHeight * ratio);
      gl.viewport(0, 0, canvas.width, canvas.height); gl.uniform2f(resolution, canvas.width, canvas.height);
    };
    const render = (now = 0) => {
      if (!active) return;
      gl.uniform1f(time, reduced ? 8.0 : now / 1000); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      if (!reduced) frame = requestAnimationFrame(render);
    };
    const handleVisibility = () => {
      active = !document.hidden;
      cancelAnimationFrame(frame);
      if (active && !reduced) frame = requestAnimationFrame(render);
    };
    resize(); render(); window.addEventListener("resize", resize); document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.removeEventListener("resize", resize); document.removeEventListener("visibilitychange", handleVisibility); cancelAnimationFrame(frame);
      if (buffer) gl.deleteBuffer(buffer);
      gl.deleteShader(vertex); gl.deleteShader(fragment); gl.deleteProgram(program);
    };
  }, []);
  return <canvas ref={canvasRef} className="space-background" aria-hidden="true" />;
}

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

export default function HudPortfolio({ data }: { data: PortfolioView }) {
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
  const receiveTurnstileToken = useCallback((token: string) => setTurnstileToken(token), []);

  const submitContact = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (sending) return;
    if (!turnstileToken) {
      setFormError("VERIFICATION_PENDING // Wait and retry.");
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
            ? "VERIFICATION_FAILED // Complete a new check."
            : result?.code === "INVALID_FIELDS"
              ? "INVALID_PAYLOAD // Check all fields."
              : "TRANSFER_FAILED // Retry later.",
        );
        return;
      }

      form.reset();
      setSent(true);
    } catch {
      setFormError("CONNECTION_LOST // Retry later.");
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
    <div ref={stageRef} className="hud-stage"><div className="hud-anchor">
      {tab === "about" && <Panel title="SYS_PROFILE" id="001" onPointerDown={dragStart("about")} offset={offsets.about ?? { x: 0, y: 0 }}>
        <div className="profile"><div className="avatar"><Glyph type="about" /></div><div><small>DESIGNATION</small><h3>{data.profile.role}</h3></div></div>
        <p>{data.profile.summary}</p>
        <div className="stats"><div><small>STATUS</small><strong>{data.profile.status}</strong></div><div><small>CLEARANCE</small><strong>{data.profile.clearance}</strong></div></div>
      </Panel>}
      {tab === "log" && <Panel title="CHRONO_CORE" id="002" onPointerDown={dragStart("log")} offset={offsets.log ?? { x: 0, y: 0 }} className="log-panel"><div className="log-grid"><div><label>TECH_SPECS</label>{data.skills.map((skill) => <div className="meter" key={skill.id}><div><span>{skill.name}</span><b>{skill.level}%</b></div><i><em style={{ width: `${skill.level}%` }} /></i></div>)}<div className="tags">{technologyTags.map((tag) => <span key={tag}>{tag}</span>)}</div></div><div className="timeline"><label>SYSTEM_LOG</label>{data.experience.map((item) => <div key={item.id}><time>{item.range}</time><b>{item.role}</b></div>)}</div></div></Panel>}
      {tab === "projects" && <div className="project-grid">
        <Panel title="DATABANK_DIR" id="003" onPointerDown={dragStart("projects-category")} offset={offsets["projects-category"] ?? { x: 0, y: 0 }}><label>SELECT_SECTOR</label>{data.categories.map((item) => <button className={`sector ${category === item.id ? "active" : ""}`} key={item.id} onClick={() => { setCategory(item.id); setSelected(null); }}><span>{item.code}</span><Glyph type="arrow" /></button>)}</Panel>
        {category && <Panel title={category.toUpperCase()} id="003-L" onPointerDown={dragStart("projects-list")} offset={offsets["projects-list"] ?? { x: 0, y: 0 }} className="list-panel"><button className="mobile-back" aria-label="Back to sectors" onClick={() => setCategory(null)}><Glyph type="back" /></button>{(projects[category] ?? []).map(project => <button className={`project-row ${selected?.id === project.id ? "active" : ""}`} key={project.id} onClick={() => setSelected(project)}><small>{project.code}</small><span>{project.name}</span><Glyph type="arrow" /></button>)}</Panel>}
        {selected && <Panel title="FILE_METADATA" id="003-D" onPointerDown={dragStart("projects-detail")} offset={offsets["projects-detail"] ?? { x: 0, y: 0 }} className="detail-panel"><button className="mobile-back" aria-label="Back to projects" onClick={() => setSelected(null)}><Glyph type="back" /></button><div className="project-visual"><Glyph type="projects" /><span>{selected.code}</span></div><h3>{selected.name}</h3><p>{selected.description}</p><div className="tags">{selected.tags.map(tag => <span key={tag}>{tag}</span>)}</div>{selected.liveUrl ? <a className="hud-action" href={selected.liveUrl} target="_blank" rel="noreferrer">INITIATE_SYNC_LINK</a> : <button className="hud-action" disabled>LINK_NOT_AVAILABLE</button>}</Panel>}
      </div>}
      {tab === "contact" && <Panel title="COMMLINK" id="004" onPointerDown={dragStart("contact")} offset={offsets.contact ?? { x: 0, y: 0 }} className="contact-panel">{sent ? <div className="success"><Glyph type="contact"/><b>TRANSFER_COMPLETE</b><p>Signal received. Response window: 24–48 hours.</p><button onClick={() => { setSent(false); setFormError(""); }}>NEW_TRANSMISSION</button></div> : <form onSubmit={submitContact}><label>IDENTIFIER<input name="name" required minLength={2} maxLength={80} autoComplete="name" placeholder="Enter name" /></label><label>FREQUENCY_ROUTE<input name="email" required maxLength={254} type="email" autoComplete="email" placeholder="Enter email" /></label><label>DATA_PAYLOAD<textarea name="message" required minLength={10} maxLength={4000} placeholder="Transmit message…" /></label><label className="signal-trap" aria-hidden="true">WEBSITE<input name="website" tabIndex={-1} autoComplete="off" /></label><TurnstileWidget onToken={receiveTurnstileToken} resetSignal={turnstileReset} />{formError && <p className="form-feedback error" role="alert">{formError}</p>}<button className="hud-action" disabled={sending || !turnstileToken}>{sending ? "TRANSMITTING…" : "INITIATE_TRANSFER"}</button></form>}</Panel>}
    </div></div>
    <nav className="hud-dock" aria-label="Portfolio sections">{(["about","log","projects","contact"] as Tab[]).map(item => <button key={item} className={tab === item ? "active" : ""} aria-current={tab === item ? "page" : undefined} onClick={() => switchTab(item)}><Glyph type={item}/><span>{item === "projects" ? "PROJ" : item === "contact" ? "LINK" : item.toUpperCase()}</span></button>)}</nav>
  </div>;
}
