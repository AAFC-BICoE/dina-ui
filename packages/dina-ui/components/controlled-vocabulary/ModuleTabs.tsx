import Link from "next/link";
import { ReactNode, useCallback, useState } from "react";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";

export interface ModuleTabConfig {
  /** key for the tab title */
  titleKey: string;
}

export interface ModuleTabsProps {
  /** Tab configurations to display */
  tabs: ModuleTabConfig[];
  /**
   * Indices of tabs that should show the "moved to controlled vocabulary" alert.
   */
  alertTabIndices?: number[];
  /**
   * If true, alert tabs show ONLY the alert (no content).
   * If false, alert tabs show the alert ABOVE the content.
   * Default: false.
   */
  alertOnly?: boolean;
  /** ID for the tabs container element */
  id?: string;
  /**
   * Render function for each tab's content.
   */
  renderTabContent: (tab: ModuleTabConfig, tabIndex: number) => ReactNode;
}

/**
 * Reusable module-scoped tabs component that can display an alert for certain tabs.
 */
export function ModuleTabs({
  tabs,
  alertTabIndices = [],
  alertOnly = false,
  id = "moduleTabs",
  renderTabContent
}: ModuleTabsProps) {
  const { formatMessage } = useDinaIntl();
  const [currentTab, setCurrentTab] = useState<number>(0);

  const [mountedTabs, setMountedTabs] = useState<Set<number>>(
    () => new Set([0])
  );

  const handleSelect = useCallback((index: number) => {
    setCurrentTab(index);
    setMountedTabs((prev) => {
      if (prev.has(index)) return prev;
      const next = new Set(prev);
      next.add(index);
      return next;
    });
  }, []);

  const showAlert = (tabIndex: number) => alertTabIndices.includes(tabIndex);
  const hasListTabs = tabs.some((_, idx) => !showAlert(idx) || !alertOnly);

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
        const isAlertTab = showAlert(index);
        const showContent = !isAlertTab || !alertOnly;
        const isActive = index === currentTab;

        return (
          <TabPanel key={tab.titleKey}>
            {isAlertTab && (
              <ManagedAttributeMovedAlert moduleKey={tab.titleKey} />
            )}

            {showContent && mountedTabs.has(index) && (
              <>
                {hasListTabs && (
                  <h3 className="mb-3">
                    <DinaMessage id={tab.titleKey as any} />
                  </h3>
                )}
                {isActive && renderTabContent(tab, index)}
              </>
            )}
          </TabPanel>
        );
      })}
    </Tabs>
  );
}

export interface ManagedAttributeMovedAlertProps {
  moduleKey: string;
}

export function ManagedAttributeMovedAlert({
  moduleKey
}: ManagedAttributeMovedAlertProps) {
  const { formatMessage } = useDinaIntl();

  return (
    <div className="alert alert-warning mt-3" role="alert">
      <h5>
        <DinaMessage
          id="managedAttributeTabAlertTitle"
          values={{ module: formatMessage(moduleKey as any) }}
        />
      </h5>
      <DinaMessage
        id="managedAttributeTabAlertDescription"
        values={{
          link: (
            <Link href="/controlled-vocabulary/list">
              <DinaMessage id="controlledVocabularyTitle" />
            </Link>
          )
        }}
      />
    </div>
  );
}
