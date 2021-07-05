import {
  DinaForm,
  LoadingSpinner,
  TextField,
  useAccount,
  useApiClient,
  useQuery
} from "../../../../../common-ui/lib";
import { ButtonBar } from "../../../../../common-ui/lib/button-bar/ButtonBar";
import { FormikButton } from "../../../../..//common-ui/lib/formik-connected/FormikButton";
import { useRouter } from "next/router";
import Link from "next/link";

import {
  DinaMessage,
  useDinaIntl
} from "../../../../../dina-ui/intl/dina-ui-intl";
import React from "react";
import useLocalStorage from "@rehooks/local-storage";
import {
  BASE_NAME,
  MaterialSampleRunConfig,
  START,
  TYPE_NUMERIC
} from "../../../../../dina-ui/types/collection-api/resources/MaterialSampleRunConfig";
import {
  computeSuffix,
  SPLIT_CHILD_SAMPLE_RUN_CONFIG_KEY
} from "./split-config";
import { MaterialSample } from "../../../../../dina-ui/types/collection-api";

import { FieldArray } from "formik";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";
import {
  MaterialSampleIdentifiersFormLayout,
  PreparationsFormLayout
} from "../edit";
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
    useLocalStorage<MaterialSampleRunActionResult | null | undefined>(
      SPLIT_CHILD_SAMPLE_RUN_ACTION_RESULT_KEY
    );

  const {
    numOfChildToCreate = 1,
    baseName = BASE_NAME,
    start = START,
    suffix = "",
    suffixType = TYPE_NUMERIC,
    generationMode = "SERIES"
  } = splitChildSampleRunConfig?.configure ?? {};

  const { sampleDescs = [], sampleNames = [] } =
    splitChildSampleRunConfig?.configure_children ?? {};

  const initialChildSamples: MaterialSample[] = [];

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

  const parentSampleId = parentResp?.data?.[0]?.id;

  // Get form initial values from run config
  for (let i = 0; i < numOfChildToCreate; i++) {
    // populate initial childsamples when the computed suffix has value, handle when there are disconnected letter suffix
    const computedSuffix = computeSuffix({ index: i, start, suffixType });

    const splitChildSampleName = sampleNames[i];
    const splitChildSampleDescription = sampleDescs[i];

    const generatedSampleName =
      generationMode === "BATCH"
        ? `${baseName}${suffix}`
        : `${baseName}-${computedSuffix}`;

    initialChildSamples.push({
      group: groupNames?.[0],
      type: "material-sample",
      description: splitChildSampleDescription,
      materialSampleName: splitChildSampleName ?? generatedSampleName
    });
  }

  const onSubmit = async submittedValues => {
    const sampleRunActionResults: MaterialSampleRunActionResult = {
      parentSampleId: parentSampleId as string,
      childrenGenerated: []
    };
    // submit to back end
    const samplesToSave = submittedValues.childSamples;
    for (const sample of samplesToSave) {
      delete sample.description;
      // link to parent
      if (parentSampleId) {
        sample.parentMaterialSample = {
          type: "material-sample",
          id: parentSampleId
        };
      }
    }

    const response = await save(
      samplesToSave.map(sample => ({
        resource: sample,
        type: "material-sample"
      })),
      { apiBaseUrl: "/collection-api" }
    );

    response.map((resp, idx) =>
      sampleRunActionResults.childrenGenerated?.push({
        id: resp.id,
        name: samplesToSave[idx].materialSampleName?.length
          ? samplesToSave[idx].materialSampleName
          : computeDefaultSampleName(idx)
      })
    );

    // save result to local for displaying on summary page
    setSplitChildSampleRunActionResult(sampleRunActionResults);
    await router.push(
      `/collection/material-sample/workflows/split-run-action-result`
    );
  };

  const buttonBar = (
    <ButtonBar className="justify-content-center">
      <Link href="/collection/material-sample/workflows/split-config">
        <a className="btn btn-secondary">
          <DinaMessage id="previous" />
        </a>
      </Link>
      <FormikButton className="btn btn-info runAction" onClick={onSubmit}>
        <DinaMessage id="next" />
      </FormikButton>
    </ButtonBar>
  );

  const onCopyFromParent = ({ index, formik }) => {
    const childSamplesPath = "childSamples";
    const childSamplePath = `${childSamplesPath}[${index}]`;
    const commonRoot = childSamplePath + ".";
    const parentSample = parentResp?.data?.[0];
    // Use the first one from return til material sample name is unuque
    formik.setFieldValue(
      commonRoot + "preparationType",
      parentSample?.preparationType
    );
    // comment til backend ready
    // formik.setFieldValue(commonRoot+"preparedBy", response?.[0].preparedBy);
    // formik.setFieldValue(commonRoot+"datePrepared", response?.[0].preparationDate);

    formik.setFieldValue(
      commonRoot + "dwcCatalogNumber",
      parentSample?.dwcCatalogNumber
    );

    formik.setFieldValue(
      commonRoot + "dwcOtherCatalogNumbers",
      parentSample?.dwcOtherCatalogNumbers
    );

    // missing backend field, comment til backend ready
    // formik.setFieldValue(
    //   commonRoot + "description",
    //   parentSample?.description
    // );
  };

  function computeDefaultSampleName(index) {
    return baseName + "-" + computeSuffix({ index, start, suffixType });
  }

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
                      <TabList>
                        {samples.map((sample, index) => (
                          <Tab key={index}>
                            <span className="m-3">
                              {sample.materialSampleName?.length
                                ? sample.materialSampleName
                                : computeDefaultSampleName(index)}
                            </span>
                          </Tab>
                        ))}
                      </TabList>
                    }
                    {samples.length
                      ? samples.map((_, index) => {
                          const childSamplesPath = "childSamples";
                          const childSamplePath = `${childSamplesPath}[${index}]`;
                          const commonRoot = childSamplePath + ".";
                          return (
                            <TabPanel key={index}>
                              <span className="d-flex fw-bold flex-row">
                                {formatMessage("materialSample") +
                                  " " +
                                  formatMessage("description")}
                                :
                              </span>
                              <div className="container">
                                <TextField
                                  name={commonRoot + "description"}
                                  hideLabel={true}
                                  multiLines={true}
                                />
                              </div>
                              <FormikButton
                                onClick={() =>
                                  onCopyFromParent({ index, formik: form })
                                }
                                className="btn btn-secondary m-1 copyFromParent"
                              >
                                <DinaMessage id="copyFromParentLabel" />
                              </FormikButton>
                              <div className="d-flex flex-row">
                                <PreparationsFormLayout
                                  namePrefix={commonRoot}
                                  className="flex-grow-1 mx-1"
                                />
                                <MaterialSampleIdentifiersFormLayout
                                  namePrefix={commonRoot}
                                  className="flex-grow-1"
                                  sampleNamePlaceHolder={computeDefaultSampleName(
                                    index
                                  )}
                                />
                              </div>
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
