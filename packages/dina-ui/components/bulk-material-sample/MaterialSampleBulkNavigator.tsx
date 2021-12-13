import { FormikProps } from "formik";
import { InputResource } from "kitsu";
import { ReactNode, RefObject, useState } from "react";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";
import { MaterialSample } from "../../types/collection-api/resources/MaterialSample";
import { useMaterialSampleSave } from "../collection";
import { SelectNavigation } from "./SelectNavigation";
import { isEmpty, compact } from "lodash";

export interface MaterialSampleBulkNavigatorProps {
  samples: SampleWithHooks[];
  renderOneSample: (
    sample: InputResource<MaterialSample>,
    index: number
  ) => ReactNode;

  extraTabs?: BulkNavigatorTab[];
}

export interface BulkNavigatorTab {
  key: string;
  title: ReactNode;
  content: () => ReactNode;
}

export interface SampleWithHooks {
  key: string;
  sample: InputResource<MaterialSample>;
  saveHook: ReturnType<typeof useMaterialSampleSave>;
  formRef: RefObject<FormikProps<InputResource<MaterialSample>>>;
}

/**
 * Under 10 samples: Shows tabs.
 * 10 or more samples: Shows dropdown navigator with arrow buttons.
 */
export function MaterialSampleBulkNavigator({
  samples,
  renderOneSample,
  extraTabs = []
}: MaterialSampleBulkNavigatorProps) {
  const tabElements = [...extraTabs, ...samples];

  const [selectedElement, setSelectedElement] = useState<
    BulkNavigatorTab | SampleWithHooks
  >(tabElements[0]);

  const tooManySamplesForTabs = samples.length >= 10;

  const tabsWithErrors = samples.reduce(
    (prev, sample) =>
      !!sample.formRef.current?.status ||
      !isEmpty(sample.formRef.current?.errors)
        ? [...prev, sample]
        : prev,
    []
  );

  return (
    <div className="sample-bulk-navigator">
      {tooManySamplesForTabs ? (
        <div>
          <div className="d-flex justify-content-center mb-3">
            <SelectNavigation<BulkNavigatorTab | SampleWithHooks>
              elements={tabElements}
              value={selectedElement}
              onChange={setSelectedElement}
              optionLabel={(element: any) =>
                element.title || element.sample?.materialSampleName
              }
              invalidElements={tabsWithErrors}
            />
          </div>
          {extraTabs.map((element, index) => (
            <div
              key={index}
              className={selectedElement.key !== element.key ? "d-none" : ""}
            >
              {element.content()}
            </div>
          ))}
          {samples.map((element, index) => (
            <div
              key={index}
              className={selectedElement.key !== element.key ? "d-none" : ""}
            >
              {renderOneSample(element.sample, index)}
            </div>
          ))}
        </div>
      ) : (
        <Tabs
          // Prevent unmounting the form on tab switch to avoid losing the form state:
          forceRenderTabPanel={true}
          selectedIndex={tabElements.findIndex(
            element => element.key === selectedElement.key
          )}
          onSelect={index => setSelectedElement(tabElements[index])}
        >
          <TabList>
            {extraTabs.map((extraTab, index) => (
              <Tab
                className={`react-tabs__tab tab-${extraTab.key}`}
                key={index}
              >
                <span className="fw-bold">{extraTab.title}</span>
              </Tab>
            ))}
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
              {extraTab.content()}
            </TabPanel>
          ))}
          {samples.map(({ sample }, index) => (
            <TabPanel
              className={`react-tabs__tab-panel sample-tabpanel-${index}`}
              key={index}
            >
              {renderOneSample(sample, index)}
            </TabPanel>
          ))}
        </Tabs>
      )}
    </div>
  );
}
