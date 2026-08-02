"use client";

import { useState } from "react";
import type { PortfolioView } from "@/src/content/types";
import type { SupportedLocale } from "@/src/i18n/config";
import { messages } from "@/src/i18n/messages";
import HudBackground from "./hud/background";
import Contact, { useContactForm } from "./hud/contact";
import HudDock from "./hud/dock";
import {
  ExperiencePanel,
  ProfilePanel,
  useHudPanels,
  type Tab,
} from "./hud/panels";
import Projects, { useProjectBrowser } from "./hud/projects";
import "./hudPortfolio.css";

export default function HudPortfolio({
  data,
  locale,
}: {
  data: PortfolioView;
  locale: SupportedLocale;
}) {
  const copy = messages[locale];
  const [tab, setTab] = useState<Tab>("about");
  const {
    stageRef,
    dragStart,
    dragMove,
    endDrag,
    resetOffsets,
    offsetFor,
  } = useHudPanels();
  const projectBrowser = useProjectBrowser(data);
  const contactForm = useContactForm(copy);

  const switchTab = (nextTab: Tab) => {
    setTab(nextTab);
    projectBrowser.reset();
    resetOffsets();
  };

  return (
    <div
      className="hud-ui"
      onPointerMove={dragMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      <HudBackground
        locale={locale}
        languageSwitcherLabel={copy.languageSwitcher}
        languageLabels={copy.languages}
      />
      <div ref={stageRef} className="hud-stage">
        <div className="hud-anchor">
          {tab === "about" && (
            <ProfilePanel
              data={data}
              copy={copy}
              onPointerDown={dragStart("about")}
              offset={offsetFor("about")}
            />
          )}
          {tab === "log" && (
            <ExperiencePanel
              data={data}
              copy={copy}
              onPointerDown={dragStart("log")}
              offset={offsetFor("log")}
            />
          )}
          {tab === "projects" && (
            <Projects
              data={data}
              copy={copy}
              browser={projectBrowser}
              dragStart={dragStart}
              offsetFor={offsetFor}
            />
          )}
          {tab === "contact" && (
            <Contact
              copy={copy}
              controller={contactForm}
              onPointerDown={dragStart("contact")}
              offset={offsetFor("contact")}
            />
          )}
        </div>
      </div>
      <HudDock
        activeTab={tab}
        labels={copy.dock}
        navigationLabel={copy.sectionsNavigation}
        onSelect={switchTab}
      />
    </div>
  );
}
