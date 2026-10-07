import { ReactNode, useCallback, useState } from "react";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";

export interface ModuleTabConfig {
  /** i18n key for the tab title */
  titleKey: string;
}

export interface ModuleTabsProps {
  /** Tab configurations to display */
  tabs: ModuleTabConfig[];
  /** ID for the tabs container element */
  id?: string;
  /**
   * Render function for each tab's inline content (inside the TabPanel).
   * Receives the tab config and its index.
   * Omit when content is rendered outside the tabs (e.g. sidebar + list below).
   */
  renderTabContent?: (tab: ModuleTabConfig, tabIndex: number) => ReactNode;
  /**
   * Controlled mode: current selected tab index.
   * When provided, the component delegates tab state to the parent.
   * Use with `onSelect`.
   */
  selectedIndex?: number;
  /**
   * Controlled mode: called when a tab is clicked.
   * Use with `selectedIndex`.
   */
  onSelect?: (index: number) => void;
}

/**
 * Reusable module-scoped tabs component.  Each tab represents a DINA module
 * (Collection, Object Store, Transactions, Sequence).
 *
 * Supports two usage modes:
 *
 * **Uncontrolled** — manages its own tab state and renders inline content
 *   via `renderTabContent`.  Content is lazy-mounted per active tab.
 *
 * **Controlled** — parent manages tab state via `selectedIndex`/`onSelect`.
 *   `renderTabContent` is optional; the parent renders content outside the
 *   tabs (sidebar, list, etc.) driven by the selected index.
 */
export function ModuleTabs({
  tabs,
  id = "moduleTabs",
  renderTabContent,
  selectedIndex: controlledIndex,
  onSelect
}: ModuleTabsProps) {
  const { formatMessage } = useDinaIntl();

  // Internal state for uncontrolled mode.
  const [internalTab, setInternalTab] = useState<number>(0);

  const isControlled = controlledIndex !== undefined;
  const currentTab = isControlled ? controlledIndex : internalTab;

  // Track which tabs have been visited so their TabPanel exists in the DOM.
  const [mountedTabs, setMountedTabs] = useState<Set<number>>(
    () => new Set([currentTab])
  );

  const handleSelect = useCallback(
    (index: number) => {
      if (!isControlled) {
        setInternalTab(index);
      }
      onSelect?.(index);
      setMountedTabs((prev) => {
        if (prev.has(index)) return prev;
        const next = new Set(prev);
        next.add(index);
        return next;
      });
    },
    [isControlled, onSelect]
  );

  return (
    <Tabs
      selectedIndex={currentTab}
      onSelect={handleSelect}
      id={id}
      className="mb-3"
    >
      <TabList>
        {tabs.map((tab) => (
          <Tab key={tab.titleKey}>{formatMessage(tab.titleKey as any)}</Tab>
        ))}
      </TabList>

      {tabs.map((tab, index) => {
        const isActive = index === currentTab;

        return (
          <TabPanel key={tab.titleKey}>
            {mountedTabs.has(index) && renderTabContent && (
              <>
                <h3 className="mb-3">
                  <DinaMessage id={tab.titleKey as any} />
                </h3>
                {/*
                 * Only render content for the active tab.
                 */}
                {isActive && renderTabContent(tab, index)}
              </>
            )}
          </TabPanel>
        );
      })}
    </Tabs>
  );
}
