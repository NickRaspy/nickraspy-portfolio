import {
  useCallback,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import type { PortfolioView } from "@/src/content/types";
import type { SupportedLocale } from "@/src/i18n/config";

export type Tab = "about" | "log" | "projects" | "contact";
export type Project = PortfolioView["projects"][number];
export type WindowKey =
  | "about"
  | "log"
  | "projects-category"
  | "projects-list"
  | "projects-detail"
  | "contact";
export type Point = { x: number; y: number };
export type DragHandler = (event: ReactPointerEvent<HTMLDivElement>) => void;

type HudMessages = (typeof import("@/src/i18n/messages"))["messages"][SupportedLocale];

const origin: Point = { x: 0, y: 0 };

export function Glyph({ type }: { type: Tab | "arrow" | "back" }) {
  const paths = {
    about: (
      <>
        <circle cx="12" cy="8" r="3" />
        <path d="M5 20v-2a7 7 0 0 1 14 0v2M4 4h2M4 4v2M20 4h-2M20 4v2" />
      </>
    ),
    log: (
      <>
        <rect x="6" y="6" width="12" height="12" />
        <path d="M9 1v3M15 1v3M9 20v3M15 20v3M1 9h3M1 15h3M20 9h3M20 15h3M10 10h4v4h-4z" />
      </>
    ),
    projects: (
      <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9zM4 7.5l8 4.5 8-4.5M12 12v9" />
    ),
    contact: <path d="m5 7 4 5-4 5M11 17h8M3 3h18v18H3z" />,
    arrow: <path d="M5 12h14M14 7l5 5-5 5" />,
    back: <path d="M19 12H5M10 7l-5 5 5 5" />,
  };

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      {paths[type]}
    </svg>
  );
}

export function Panel({
  title,
  id,
  children,
  onPointerDown,
  offset,
  className = "",
}: {
  title: string;
  id: string;
  children: ReactNode;
  onPointerDown: DragHandler;
  offset: Point;
  className?: string;
}) {
  return (
    <section
      className={`hud-panel ${className}`}
      aria-labelledby={`hud-${id}`}
      style={{ transform: `translate3d(${offset.x}px,${offset.y}px,0)` }}
    >
      <div className="hud-header" onPointerDown={onPointerDown}>
        <h2 id={`hud-${id}`}>{title}</h2>
        <span>ID:{id}</span>
      </div>
      {children}
    </section>
  );
}

export function useHudPanels() {
  const [offsets, setOffsets] = useState<Partial<Record<WindowKey, Point>>>({});
  const stageRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{
    key: WindowKey;
    x: number;
    y: number;
    ox: number;
    oy: number;
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  } | null>(null);

  const dragStart = useCallback(
    (key: WindowKey) => (event: ReactPointerEvent<HTMLDivElement>) => {
      if (
        window.innerWidth < 768 ||
        (event.target as HTMLElement).closest("button,input,textarea")
      ) {
        return;
      }

      const panel = event.currentTarget.closest<HTMLElement>(".hud-panel");
      const stage = stageRef.current;
      if (!panel || !stage) return;

      event.currentTarget.setPointerCapture(event.pointerId);
      const offset = offsets[key] ?? origin;
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
    },
    [offsets],
  );

  const dragMove = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;

    const activeDrag = drag.current;
    const next = {
      x: Math.max(
        activeDrag.minX,
        Math.min(activeDrag.maxX, activeDrag.ox + event.clientX - activeDrag.x),
      ),
      y: Math.max(
        activeDrag.minY,
        Math.min(activeDrag.maxY, activeDrag.oy + event.clientY - activeDrag.y),
      ),
    };
    setOffsets((current) => ({ ...current, [activeDrag.key]: next }));
  }, []);

  const endDrag = useCallback(() => {
    drag.current = null;
  }, []);
  const resetOffsets = useCallback(() => setOffsets({}), []);
  const offsetFor = useCallback((key: WindowKey) => offsets[key] ?? origin, [offsets]);

  return { stageRef, dragStart, dragMove, endDrag, resetOffsets, offsetFor };
}

export function ProfilePanel({
  data,
  copy,
  onPointerDown,
  offset,
}: {
  data: PortfolioView;
  copy: HudMessages;
  onPointerDown: DragHandler;
  offset: Point;
}) {
  return (
    <Panel title={copy.panels.profile} id="001" onPointerDown={onPointerDown} offset={offset}>
      <div className="profile">
        <div className="avatar">
          <Glyph type="about" />
        </div>
        <div>
          <small>{copy.labels.designation}</small>
          <h3>{data.profile.role}</h3>
        </div>
      </div>
      <p>{data.profile.summary}</p>
      <div className="stats">
        <div>
          <small>{copy.labels.status}</small>
          <strong>{copy.profileValues[data.profile.status] ?? data.profile.status}</strong>
        </div>
        <div>
          <small>{copy.labels.clearance}</small>
          <strong>{copy.profileValues[data.profile.clearance] ?? data.profile.clearance}</strong>
        </div>
      </div>
    </Panel>
  );
}

export function ExperiencePanel({
  data,
  copy,
  onPointerDown,
  offset,
}: {
  data: PortfolioView;
  copy: HudMessages;
  onPointerDown: DragHandler;
  offset: Point;
}) {
  const technologyTags = [...new Set(data.projects.flatMap((project) => project.tags))].slice(
    0,
    3,
  );

  return (
    <Panel
      title={copy.panels.experience}
      id="002"
      onPointerDown={onPointerDown}
      offset={offset}
      className="log-panel"
    >
      <div className="log-grid">
        <div>
          <label>{copy.labels.technicalSpecs}</label>
          {data.skills.map((skill) => (
            <div className="meter" key={skill.id}>
              <div>
                <span>{skill.name}</span>
                <b>{skill.level}%</b>
              </div>
              <i>
                <em style={{ width: `${skill.level}%` }} />
              </i>
            </div>
          ))}
          <div className="tags">
            {technologyTags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
        </div>
        <div className="timeline">
          <label>{copy.labels.systemLog}</label>
          {data.experience.map((item) => (
            <div key={item.id}>
              <time>{item.range}</time>
              <b>{item.role}</b>
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
}
