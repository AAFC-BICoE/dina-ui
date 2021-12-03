import { InputResource } from "kitsu";
import { ReactNode, useState } from "react";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";
import { MaterialSample } from "../../types/collection-api/resources/MaterialSample";
import { SelectNavigation } from "./SelectNavigation";

export interface MaterialSampleBulkNavigatorProps {
  samples: InputResource<MaterialSample>[];
  renderOneSample: (
    sample: InputResource<MaterialSample>,
    index: number
  ) => ReactNode;
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

  return (
    <div className="sample-bulk-navigator">
      {tooManySamplesForTabs ? (
        <div>
          <div className="d-flex justify-content-center mb-3">
            <SelectNavigation
              elements={samples}
              value={tabIndex}
              onChange={setTabIndex}
              optionLabel={sample => sample.materialSampleName}
            />
          </div>
          {samples.map((sample, index) => (
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
            {samples.map((sample, index) => (
              <Tab
                className={`react-tabs__tab sample-tab-${index}`}
                key={index}
              >
                {sample.materialSampleName || `#${index + 1}`}
              </Tab>
            ))}
          </TabList>
          {samples.map((sample, index) => (
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
