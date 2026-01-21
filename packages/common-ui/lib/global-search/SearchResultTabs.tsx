import { Nav } from "react-bootstrap";
import { getIndexConfig } from "./searchConfig";
import { DinaMessage } from "packages/dina-ui/intl/dina-ui-intl";

export interface TabData {
  key: string;
  label: string;
  count: number;
}

export interface SearchResultTabsProps {
  tabs: TabData[];
  activeTab: string;
  onTabChange: (tabKey: string) => void;
}

export function SearchResultTabs({
  tabs,
  activeTab,
  onTabChange
}: SearchResultTabsProps) {
  // Only show tabs that have results, but always show "All Results" tab
  const visibleTabs = tabs.filter((tab) => tab.key === "all" || tab.count > 0);

  return (
    <Nav variant="tabs" className="mb-4">
      {visibleTabs.map((tab) => (
        <Nav.Item key={tab.key}>
          <Nav.Link
            active={activeTab === tab.key}
            onClick={() => onTabChange(tab.key)}
            className="d-flex align-items-center gap-2"
            style={{
              color: "inherit",
              fontWeight: activeTab === tab.key ? "bold" : "normal"
            }}
          >
            {tab.key !== "all" &&
              (() => {
                const config = getIndexConfig(tab.key);
                if (config) {
                  const Icon = config.icon;
                  return <Icon />;
                }
                return null;
              })()}
            <DinaMessage id={tab.label as any} />
            {tab.count > 0 && (
              <span className="badge bg-secondary rounded-pill">
                {tab.count}
              </span>
            )}
          </Nav.Link>
        </Nav.Item>
      ))}
    </Nav>
  );
}
