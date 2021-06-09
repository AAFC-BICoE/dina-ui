import {
  DinaForm,
  TextField,
  useAccount,
  useApiClient
} from "packages/common-ui/lib";
import { ButtonBar } from "packages/common-ui/lib/button-bar/ButtonBar";
import { FormikButton } from "packages/common-ui/lib/formik-connected/FormikButton";

import { DinaMessage, useDinaIntl } from "packages/dina-ui/intl/dina-ui-intl";
import React from "react";
import useLocalStorage from "@rehooks/local-storage";
import { MaterialSampleRunConfig } from "packages/dina-ui/types/collection-api/resources/MaterialSampleRunConfig";
import {
  computeSuffix,
  SPLIT_CHILD_SAMPLE_RUN_CONFIG_KEY
} from "./split-config";
import { MaterialSample } from "packages/dina-ui/types/collection-api";

import { FieldArray } from "formik";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";
import { PreparationsFormLayout } from "../edit";
import { MaterialSampleRunActionResult } from "packages/dina-ui/types/collection-api/resources/MaterialSampleRunActionResult";

export const SPLIT_CHILD_SAMPLE_RUN_ACTION_RESULT_KEY =
  "split-child-sample-run-action-result";

export default function SplitRunAction(props) {
  const { nextStep, previousStep } = props;
  const { formatMessage } = useDinaIntl();
  const { save } = useApiClient();
  const { groupNames } = useAccount();

  const [splitChildSampleRunConfig, _setSplitChildSampleRunConfig] =
    useLocalStorage<MaterialSampleRunConfig | null | undefined>(
      SPLIT_CHILD_SAMPLE_RUN_CONFIG_KEY
    );

  const [_, setSplitChildSampleRunActionResult] = useLocalStorage<
    MaterialSampleRunActionResult[] | null | undefined
  >(SPLIT_CHILD_SAMPLE_RUN_ACTION_RESULT_KEY);

  const initialChildSamples: MaterialSample[] = [];
  const numOfChildToCreate =
    splitChildSampleRunConfig?.configure?.numOfChildToCreate ?? 1;
  const start = splitChildSampleRunConfig?.configure.start;
  const type = splitChildSampleRunConfig?.configure.type;
  const baseName = splitChildSampleRunConfig?.configure?.baseName;

  for (let i = 0; i < numOfChildToCreate; i++) {
    const splitChildSampleName =
      splitChildSampleRunConfig?.configure_children?.sampleNames?.[i];
    initialChildSamples.push({
      group: groupNames?.[0],
      type: "material-sample",
      materialSampleName:
        splitChildSampleName ??
        baseName + "-" + computeSuffix({ index: i, start, type })
    });
  }

  const onSubmit = submittedValues => {
    const savedChildSamples: MaterialSampleRunActionResult[] = [];
    // submit to back end
    submittedValues.childSamples.map(async childSample => {
      const [response] = await save(
        [
          {
            resource: childSample,
            type: "material-sample"
          }
        ],
        { apiBaseUrl: "/collection-api" }
      );
      savedChildSamples.push({
        id: response.id,
        name: childSample.materialSampleName
      });
    });
    // save result to local for displaying on summary page
    setSplitChildSampleRunActionResult(savedChildSamples);
    nextStep();
  };

  const onBack = () => {
    previousStep();
  };

  const buttonBar = (
    <ButtonBar className="justify-content-center">
      <FormikButton className="btn btn-secondary" onClick={onBack}>
        <DinaMessage id="backLabel" />
      </FormikButton>

      <FormikButton className="btn btn-info" onClick={onSubmit}>
        <DinaMessage id="next" />
      </FormikButton>
    </ButtonBar>
  );

  return (
    <div>
      <DinaForm initialValues={{ childSamples: initialChildSamples }}>
        <p>
          <span className="fw-bold">{formatMessage("description")}:</span>
          {formatMessage("splitSampleDescription")}
        </p>
        <p className="fw-bold">
          {formatMessage("stepLabel")}2: {formatMessage("dataEntryLabel")}
        </p>

        <FieldArray name="childSamples">
          {({ form }) => {
            const samples = form.initialValues.childSamples;
            return (
              <div className="child-sample-section">
                <Tabs>
                  {
                    // Only show the tabs when there is more than 1 child sample:
                    <TabList
                      className={`react-tabs__tab-list ${
                        samples.length === 1 ? "d-none" : ""
                      }`}
                    >
                      {samples.map((sample, index) => (
                        <Tab key={index}>
                          <span className="m-3">
                            {sample.materialSampleName}
                          </span>
                        </Tab>
                      ))}
                    </TabList>
                  }
                  {samples.length
                    ? samples.map((_sample, index) => {
                        const childSamplesPath = "childSamples";
                        const childSamplePath = `${childSamplesPath}[${index}]`;
                        const commonRoot = childSamplePath + ".";
                        return (
                          <TabPanel key={index}>
                            <TextField
                              name={`${commonRoot}materialSampleName`}
                            />
                            <PreparationsFormLayout />
                          </TabPanel>
                        );
                      })
                    : null}
                </Tabs>
              </div>
            );
          }}
        </FieldArray>
        {buttonBar}
      </DinaForm>
    </div>
  );
}
