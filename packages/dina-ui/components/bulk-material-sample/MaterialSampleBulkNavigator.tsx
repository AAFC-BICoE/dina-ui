import classNames from "classnames";
import { SampleWithHooks } from "common-ui";
import { FormikProps } from "formik";
import { InputResource } from "kitsu";
import { isEmpty } from "lodash";
import { ReactNode, RefObject } from "react";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";
import { MaterialSample } from "../../types/collection-api/resources/MaterialSample";
import { SelectNavigation } from "./SelectNavigation";

export interface MaterialSampleBulkNavigatorProps {
  samples: SampleWithHooks[];
  renderOneSample: (sampleRenderProps: SampleRenderProps) => ReactNode;
  selectedTab: BulkNavigatorTab | SampleWithHooks;
  onSelectTab: (newSelected: SampleWithHooks | BulkNavigatorTab) => void;
  extraTabs?: BulkNavigatorTab[];
}

export interface SampleRenderProps {
  sample: InputResource<MaterialSample>;
  index: number;
  isSelected: boolean;
}

export interface BulkNavigatorTab {
  key: string;
  title: ReactNode;
  content: (isSelected: boolean) => ReactNode;
  formRef: RefObject<FormikProps<InputResource<MaterialSample>>>;
}

/**
 * Under 10 samples: Shows tabs.
 * 10 or more samples: Shows dropdown navigator with arrow buttons.
 */
export function MaterialSampleBulkNavigator({
  selectedTab,
  onSelectTab,
  samples,
  renderOneSample,
  extraTabs = []
}: MaterialSampleBulkNavigatorProps) {
  const tabElements = [...extraTabs, ...samples];

  const tooManySamplesForTabs = samples.length >= 10;

  const tabsWithErrors = [...samples, ...extraTabs].filter(
    sample =>
      !!sample.formRef.current?.status ||
      !isEmpty(sample.formRef.current?.errors)
  );

  function isSelected(key: string) {
    return selectedTab.key === key;
  }

  return (
    <div className="sample-bulk-navigator">
      {tooManySamplesForTabs ? (
        <div>
          <div className="d-flex justify-content-center mb-3">
            <SelectNavigation<BulkNavigatorTab | SampleWithHooks>
              elements={tabElements}
              value={selectedTab}
              onChange={onSelectTab}
              optionLabel={(element: any) =>
                element.title || element.sample?.materialSampleName
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
          {samples.map((element, index) => (
            <div
              key={index}
              className={selectedTab.key !== element.key ? "d-none" : ""}
            >
              {renderOneSample({
                sample: element.sample,
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
            {samples.map((sample, index) => {
              const tabHasError = tabsWithErrors.includes(sample);
              return (
                <Tab
                  className={`react-tabs__tab sample-tab-${index}`}
                  key={index}
                >
                  <span className={tabHasError ? "text-danger is-invalid" : ""}>
                    {sample.sample.materialSampleName || `#${index + 1}`}
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
          {samples.map((tab, index) => (
            <TabPanel
              className={`react-tabs__tab-panel sample-tabpanel-${index}`}
              key={index}
            >
              {renderOneSample({
                sample: tab.sample,
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
