import classNames from "classnames";
import { ResourceWithHooks } from "common-ui";
import { FormikProps } from "formik";
import { InputResource, KitsuResource } from "kitsu";
import { isEmpty } from "lodash";
import { ReactNode, RefObject } from "react";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";
import { SelectNavigation } from "./SelectNavigation";

export interface BulkEditNavigatorProps {
  resources: ResourceWithHooks[];
  renderOneResource: (resourceRenderProps: ResourceRenderProps) => ReactNode;
  selectedTab: BulkNavigatorTab | ResourceWithHooks;
  onSelectTab: (newSelected: ResourceWithHooks | BulkNavigatorTab) => void;
  extraTabs?: BulkNavigatorTab[];
  tabNameConfig?: (resource: ResourceWithHooks) => string | undefined;
}

export interface ResourceRenderProps<T extends KitsuResource = KitsuResource> {
  resource: InputResource<T>;
  index: number;
  isSelected: boolean;
}

export interface BulkNavigatorTab<T extends KitsuResource = KitsuResource> {
  key: string;
  title: ReactNode;
  content: (isSelected: boolean) => ReactNode;
  formRef: RefObject<FormikProps<InputResource<T>>>;
}

/**
 * Under 10 resources: Shows tabs.
 * 10 or more resources: Shows dropdown navigator with arrow buttons.
 */
export function BulkEditNavigator({
  selectedTab,
  onSelectTab,
  resources,
  renderOneResource,
  extraTabs = [],
  tabNameConfig
}: BulkEditNavigatorProps) {
  const tabElements = [...extraTabs, ...resources];

  const tooManyResourcesForTabs = resources.length >= 10;

  const tabsWithErrors = [...resources, ...extraTabs].filter(
    (resource) =>
      !!resource.formRef.current?.status ||
      !isEmpty(resource.formRef.current?.errors)
  );

  function isSelected(key: string) {
    return selectedTab.key === key;
  }

  return (
    <div className="sample-bulk-navigator">
      {tooManyResourcesForTabs ? (
        <div>
          <div className="d-flex justify-content-center mb-3">
            <SelectNavigation<BulkNavigatorTab | ResourceWithHooks>
              elements={tabElements}
              value={selectedTab}
              onChange={onSelectTab}
              optionLabel={(element: any) => {
                const tabName = tabNameConfig ? tabNameConfig(element) : null;
                return element.title || tabName;
              }}
              invalidElements={tabsWithErrors}
            />
          </div>
          {extraTabs.map((extraTab, index) => (
            <div
              key={index}
              className={isSelected(extraTab.key) ? "" : "d-none"}
            >
              {extraTab.content(isSelected(extraTab.key))}
            </div>
          ))}
          {resources.map((element, index) => (
            <div
              key={index}
              className={selectedTab.key !== element.key ? "d-none" : ""}
            >
              {renderOneResource({
                resource: element.resource,
                index,
                isSelected: isSelected(element.key)
              })}
            </div>
          ))}
        </div>
      ) : (
        <Tabs
          // Prevent unmounting the form on tab switch to avoid losing the form state:
          forceRenderTabPanel={true}
          selectedIndex={tabElements.findIndex(
            (element) => element.key === selectedTab.key
          )}
          onSelect={(index) => onSelectTab(tabElements[index])}
        >
          <TabList>
            {extraTabs.map((extraTab, index) => {
              const tabHasError = tabsWithErrors.includes(extraTab);

              return (
                <Tab
                  className={`react-tabs__tab tab-${extraTab.key}`}
                  key={index}
                >
                  <span
                    className={classNames(
                      "fw-bold",
                      tabHasError && "text-danger is-invalid"
                    )}
                  >
                    {extraTab.title}
                  </span>
                </Tab>
              );
            })}
            {resources.map((resource, index) => {
              const tabHasError = tabsWithErrors.includes(resource);
              const tabName = tabNameConfig ? tabNameConfig(resource) : null;
              return (
                <Tab
                  className={`react-tabs__tab sample-tab-${index}`}
                  key={index}
                >
                  <span className={tabHasError ? "text-danger is-invalid" : ""}>
                    {tabName || `#${index + 1}`}
                  </span>
                </Tab>
              );
            })}
          </TabList>
          {extraTabs.map((extraTab, index) => (
            <TabPanel
              className={`react-tabs__tab-panel tabpanel-${extraTab.key}`}
              key={index}
            >
              {extraTab.content(isSelected(extraTab.key))}
            </TabPanel>
          ))}
          {resources.map((tab, index) => (
            <TabPanel
              className={`react-tabs__tab-panel sample-tabpanel-${index}`}
              key={index}
            >
              {renderOneResource({
                resource: tab.resource,
                index,
                isSelected: isSelected(tab.key)
              })}
            </TabPanel>
          ))}
        </Tabs>
      )}
    </div>
  );
}
