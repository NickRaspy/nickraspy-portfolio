import { Glyph, type Tab } from "./panels";

const tabs: Tab[] = ["about", "log", "projects", "contact"];

export default function HudDock({
  activeTab,
  labels,
  navigationLabel,
  onSelect,
}: {
  activeTab: Tab;
  labels: Record<Tab, string>;
  navigationLabel: string;
  onSelect: (tab: Tab) => void;
}) {
  return (
    <nav className="hud-dock" aria-label={navigationLabel}>
      {tabs.map((tab) => (
        <button
          key={tab}
          className={activeTab === tab ? "active" : ""}
          aria-current={activeTab === tab ? "page" : undefined}
          onClick={() => onSelect(tab)}
        >
          <Glyph type={tab} />
          <span>{labels[tab]}</span>
        </button>
      ))}
    </nav>
  );
}
