import { useCallback, useMemo, useState } from "react";
import type { PortfolioView } from "@/src/content/types";
import type { SupportedLocale } from "@/src/i18n/config";
import {
  Glyph,
  Panel,
  type DragHandler,
  type Point,
  type Project,
  type WindowKey,
} from "./panels";

type HudMessages = (typeof import("@/src/i18n/messages"))["messages"][SupportedLocale];

export function useProjectBrowser(data: PortfolioView) {
  const [category, setCategory] = useState<string | null>(null);
  const [selected, setSelected] = useState<Project | null>(null);
  const projects = useMemo(
    () =>
      data.projects.reduce<Record<string, Project[]>>((groups, project) => {
        (groups[project.categoryId] ??= []).push(project);
        return groups;
      }, {}),
    [data.projects],
  );
  const selectedCategory = data.categories.find((item) => item.id === category);
  const reset = useCallback(() => {
    setCategory(null);
    setSelected(null);
  }, []);

  return {
    category,
    selected,
    projects,
    selectedCategory,
    selectCategory: (nextCategory: string) => {
      setCategory(nextCategory);
      setSelected(null);
    },
    selectProject: setSelected,
    backToSectors: () => setCategory(null),
    backToProjects: () => setSelected(null),
    reset,
  };
}

export default function Projects({
  data,
  copy,
  browser,
  dragStart,
  offsetFor,
}: {
  data: PortfolioView;
  copy: HudMessages;
  browser: ReturnType<typeof useProjectBrowser>;
  dragStart: (key: WindowKey) => DragHandler;
  offsetFor: (key: WindowKey) => Point;
}) {
  return (
    <div className="project-grid">
      <Panel
        title={copy.panels.projects}
        id="003"
        onPointerDown={dragStart("projects-category")}
        offset={offsetFor("projects-category")}
      >
        <label>{copy.labels.selectSector}</label>
        {data.categories.map((item) => (
          <button
            className={`sector ${browser.category === item.id ? "active" : ""}`}
            key={item.id}
            onClick={() => browser.selectCategory(item.id)}
          >
            <span>
              <b>{item.name}</b>
              <small>{item.code}</small>
            </span>
            <Glyph type="arrow" />
          </button>
        ))}
      </Panel>

      {browser.category && (
        <Panel
          title={(browser.selectedCategory?.name ?? browser.category).toUpperCase()}
          id="003-L"
          onPointerDown={dragStart("projects-list")}
          offset={offsetFor("projects-list")}
          className="list-panel"
        >
          <button
            className="mobile-back"
            aria-label={copy.project.backToSectors}
            onClick={browser.backToSectors}
          >
            <Glyph type="back" />
          </button>
          {(browser.projects[browser.category] ?? []).map((project) => (
            <button
              className={`project-row ${browser.selected?.id === project.id ? "active" : ""}`}
              key={project.id}
              onClick={() => browser.selectProject(project)}
            >
              <small>{project.code}</small>
              <span>{project.name}</span>
              <Glyph type="arrow" />
            </button>
          ))}
        </Panel>
      )}

      {browser.selected && (
        <Panel
          title={copy.panels.projectMetadata}
          id="003-D"
          onPointerDown={dragStart("projects-detail")}
          offset={offsetFor("projects-detail")}
          className="detail-panel"
        >
          <button
            className="mobile-back"
            aria-label={copy.project.backToProjects}
            onClick={browser.backToProjects}
          >
            <Glyph type="back" />
          </button>
          <div className="project-visual">
            <Glyph type="projects" />
            <span>{browser.selected.code}</span>
          </div>
          <h3>{browser.selected.name}</h3>
          <p>{browser.selected.description}</p>
          <div className="tags">
            {browser.selected.tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
          {browser.selected.liveUrl ? (
            <a
              className="hud-action"
              href={browser.selected.liveUrl}
              target="_blank"
              rel="noreferrer"
            >
              {copy.project.openLive}
            </a>
          ) : (
            <button className="hud-action" disabled>
              {copy.project.linkUnavailable}
            </button>
          )}
        </Panel>
      )}
    </div>
  );
}
