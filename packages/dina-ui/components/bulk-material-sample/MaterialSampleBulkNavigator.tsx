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
}

export interface SampleWithHooks {
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
  renderOneSample
}: MaterialSampleBulkNavigatorProps) {
  const [tabIndex, setTabIndex] = useState(0);

  const tooManySamplesForTabs = samples.length >= 10;

  const tabsWithErrors = samples.reduce<number[]>(
    (prev, { formRef }, index) =>
      !!formRef.current?.status || !isEmpty(formRef.current?.errors)
        ? [...prev, index]
        : prev,
    []
  );

  return (
    <div className="sample-bulk-navigator">
      {tooManySamplesForTabs ? (
        <div>
          <div className="d-flex justify-content-center mb-3">
            <SelectNavigation
              elements={samples}
              value={tabIndex}
              onChange={setTabIndex}
              optionLabel={({ sample }) => sample.materialSampleName}
              invalidElements={tabsWithErrors}
            />
          </div>
          {samples.map(({ sample }, index) => (
            <div key={index} className={tabIndex !== index ? "d-none" : ""}>
              {renderOneSample(sample, index)}
            </div>
          ))}
        </div>
      ) : (
        <Tabs
          // Prevent unmounting the form on tab switch to avoid losing the form state:
          forceRenderTabPanel={true}
        >
          <TabList>
            {samples.map(({ sample }, index) => {
              const tabHasError = tabsWithErrors.includes(index);

              return (
                <Tab
                  className={`react-tabs__tab sample-tab-${index}`}
                  key={index}
                >
                  <span className={tabHasError ? "text-danger is-invalid" : ""}>
                    {sample.materialSampleName || `#${index + 1}`}
                  </span>
                </Tab>
              );
            })}
          </TabList>
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
