import {
  CheckBoxWithoutWrapper,
  DinaForm,
  LoadingSpinner,
  useAccount,
  useApiClient,
  useQuery
} from "../../../../../common-ui/lib";
import { ButtonBar } from "../../../../../common-ui/lib/button-bar/ButtonBar";
import { FormikButton } from "../../../../..//common-ui/lib/formik-connected/FormikButton";
import { useRouter } from "next/router";

import { Field } from "formik";

import {
  DinaMessage,
  useDinaIntl
} from "../../../../../dina-ui/intl/dina-ui-intl";
import React from "react";
import useLocalStorage from "@rehooks/local-storage";
import { MaterialSampleRunConfig } from "../../../../../dina-ui/types/collection-api/resources/MaterialSampleRunConfig";
import {
  computeSuffix,
  SPLIT_CHILD_SAMPLE_RUN_CONFIG_KEY
} from "./split-config";
import { MaterialSample } from "../../../../../dina-ui/types/collection-api";

import { FieldArray } from "formik";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";
import { PreparationsFormLayout } from "../edit";
import { MaterialSampleRunActionResult } from "../../../../../dina-ui/types/collection-api/resources/MaterialSampleRunActionResult";
import { Head } from "../../../../../dina-ui/components/head";
import { Nav } from "../../../../../dina-ui/components/button-bar/nav/nav";

export const SPLIT_CHILD_SAMPLE_RUN_ACTION_RESULT_KEY =
  "split-child-sample-run-action-result";

export default function SplitRunAction() {
  const { formatMessage } = useDinaIntl();
  const { save } = useApiClient();
  const { groupNames } = useAccount();
  const router = useRouter();
  const [splitChildSampleRunConfig, _setSplitChildSampleRunConfig] =
    useLocalStorage<MaterialSampleRunConfig | null | undefined>(
      SPLIT_CHILD_SAMPLE_RUN_CONFIG_KEY
    );

  const [_splitChildSampleRunActionResult, setSplitChildSampleRunActionResult] =
    useLocalStorage<MaterialSampleRunActionResult[] | null | undefined>(
      SPLIT_CHILD_SAMPLE_RUN_ACTION_RESULT_KEY
    );
  const initialChildSamples: MaterialSample[] = [];
  const numOfChildToCreate =
    splitChildSampleRunConfig?.configure?.numOfChildToCreate ?? 1;
  const start = splitChildSampleRunConfig?.configure?.start;
  const type = splitChildSampleRunConfig?.configure?.type;
  const baseName = splitChildSampleRunConfig?.configure?.baseName;

  // Retrive the parent material sample upfront
  const { loading, response: parentResp } = useQuery<MaterialSample[]>({
    filter: {
      materialSampleName: baseName as string
    },
    path: "collection-api/material-sample",
    include: "preparationType"
  });

  if (loading) {
    return <LoadingSpinner loading={true} />;
  }
  // Get form initial values from run config
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

  const onSubmit = async submittedValues => {
    const sampleRunActionResults: MaterialSampleRunActionResult[] = [];
    // submit to back end
    for (const sample of submittedValues.childSamples) {
      delete sample.copyFromParent;
      const [response] = await save(
        [
          {
            resource: sample,
            type: "material-sample"
          }
        ],
        { apiBaseUrl: "/collection-api" }
      );
      sampleRunActionResults.push({
        id: response.id,
        name: sample.materialSampleName
      });
    }
    // save result to local for displaying on summary page
    setSplitChildSampleRunActionResult(sampleRunActionResults);
    await router.push(
      `/collection/material-sample/workflows/split-run-action-result`
    );
  };

  const onBack = async () => {
    await router.push(`/collection/material-sample/workflows/split-config`);
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

  const onCopyFromParent = ({ formik, index }) => {
    const childSamplesPath = "childSamples";
    const childSamplePath = `${childSamplesPath}[${index}]`;
    const commonRoot = childSamplePath + ".";
    // Use the first one from return til material sample name is unuque
    formik.setFieldValue(
      commonRoot + "preparationType",
      parentResp?.data[0].preparationType
    );
    // formik.setFieldValue(commonRoot+"preparedBy", response?.[0].preparedBy);
    // formik.setFieldValue(commonRoot+"datePrepared", response?.[0].preparationDate);
  };

  return (
    <div>
      <Head title={formatMessage("splitSubsampleTitle")} />
      <Nav />
      <main className="container-fluid">
        <h1>
          <DinaMessage id="splitSubsampleTitle" />
        </h1>
        <DinaForm initialValues={{ childSamples: initialChildSamples ?? [] }}>
          <p>
            <span className="fw-bold">{formatMessage("description")}:</span>
            {formatMessage("splitSampleDescription")}
          </p>
          <p className="fw-bold">
            {formatMessage("stepLabel")}2: {formatMessage("dataEntryLabel")}
          </p>

          <FieldArray name="childSamples">
            {({ form }) => {
              const samples = form.values.childSamples;
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
                              <Field>
                                {({ form: formik }) => (
                                  <CheckBoxWithoutWrapper
                                    name={`${commonRoot}copyFromParent`}
                                    onClickIncludeAll={() =>
                                      onCopyFromParent({ formik, index })
                                    }
                                    includeAllLabel={formatMessage(
                                      "copyFromParentLabel"
                                    )}
                                  />
                                )}
                              </Field>
                              <PreparationsFormLayout namePrefix={commonRoot} />
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
      </main>
    </div>
  );
}
