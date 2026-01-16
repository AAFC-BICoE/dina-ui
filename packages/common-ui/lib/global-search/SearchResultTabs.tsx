import { Nav } from "react-bootstrap";

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
  return (
    <Nav variant="tabs" className="mb-4">
      {tabs.map((tab) => (
        <Nav.Item key={tab.key}>
          <Nav.Link
            active={activeTab === tab.key}
            onClick={() => onTabChange(tab.key)}
            className="d-flex align-items-center gap-2"
          >
            {tab.label}
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
