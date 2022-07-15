import classNames from "classnames";
import { FormikProps } from "formik";
import { InputResource } from "kitsu";
import { isEmpty } from "lodash";
import { MetadataWithHooks } from "packages/common-ui/lib/bulk-edit/bulk-context-metadata";
import { ReactNode, RefObject } from "react";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";
import { Metadata } from "../../../types/objectstore-api";
import { SelectNavigation } from "../../bulk-material-sample/SelectNavigation";

export interface MetadataBulkNavigatorProps {
  metadatas: MetadataWithHooks[];
  renderOneMetadata: (metadataRenderProps: MetadataRenderProps) => ReactNode;
  selectedTab: BulkNavigatorTab | MetadataWithHooks;
  onSelectTab: (newSelected: MetadataWithHooks | BulkNavigatorTab) => void;
  extraTabs?: BulkNavigatorTab[];
}

export interface MetadataRenderProps {
  metadata: InputResource<Metadata>;
  index: number;
  isSelected: boolean;
}

export interface BulkNavigatorTab {
  key: string;
  title: ReactNode;
  content: (isSelected: boolean) => ReactNode;
  formRef: RefObject<FormikProps<InputResource<Metadata>>>;
}

/**
 * Under 10 metadatas: Shows tabs.
 * 10 or more metadatas: Shows dropdown navigator with arrow buttons.
 */
export function MetadataBulkNavigator({
  selectedTab,
  onSelectTab,
  metadatas,
  renderOneMetadata,
  extraTabs = []
}: MetadataBulkNavigatorProps) {
  const tabElements = [...extraTabs, ...metadatas];

  const tooManyMetadatasForTabs = metadatas.length >= 10;

  // TODO: change from sample from SampleWithHooks to metadata
  const tabsWithErrors = [...metadatas, ...extraTabs].filter(
    metadata =>
      !!metadata.formRef.current?.status ||
      !isEmpty(metadata.formRef.current?.errors)
  );

  function isSelected(key: string) {
    return selectedTab.key === key;
  }

  return (
    <div className="sample-bulk-navigator">
      {tooManyMetadatasForTabs ? (
        <div>
          <div className="d-flex justify-content-center mb-3">
            <SelectNavigation<BulkNavigatorTab | MetadataWithHooks>
              elements={tabElements}
              value={selectedTab}
              onChange={onSelectTab}
              optionLabel={(element: any) =>
                element.title || element.metadata?.fileIdentifier
              }
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
          {metadatas.map((element, index) => (
            <div
              key={index}
              className={selectedTab.key !== element.key ? "d-none" : ""}
            >
              {renderOneMetadata({
                metadata: element.metadata,
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
            element => element.key === selectedTab.key
          )}
          onSelect={index => onSelectTab(tabElements[index])}
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
            {metadatas.map((metadata, index) => {
              const tabHasError = tabsWithErrors.includes(metadata);
              return (
                <Tab
                  className={`react-tabs__tab sample-tab-${index}`}
                  key={index}
                >
                  <span className={tabHasError ? "text-danger is-invalid" : ""}>
                    {metadata.metadata.fileIdentifier || `#${index + 1}`}
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
          {metadatas.map((tab, index) => (
            <TabPanel
              className={`react-tabs__tab-panel sample-tabpanel-${index}`}
              key={index}
            >
              {renderOneMetadata({
                metadata: tab.metadata,
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
