import {
  DinaForm,
  LoadingSpinner,
  SelectFieldWithNav,
  TextField,
  useAccount,
  useApiClient,
  useQuery,
  FieldSet,
  useModal,
  AreYouSureModal
} from "../../../../../common-ui/lib";
import { ButtonBar } from "../../../../../common-ui/lib/button-bar/ButtonBar";
import { FormikButton } from "../../../../..//common-ui/lib/formik-connected/FormikButton";
import { useRouter } from "next/router";
import Link from "next/link";
import Switch from "react-switch";
import {
  DinaMessage,
  useDinaIntl
} from "../../../../../dina-ui/intl/dina-ui-intl";
import React, {
  useState,
  useLayoutEffect,
  Dispatch,
  SetStateAction
} from "react";
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

import { Field, FieldArray } from "formik";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";
import {
  MaterialSampleIdentifiersFormLayout,
  PreparationsFormLayout
} from "../edit";
import { MaterialSampleRunActionResult } from "../../../../../dina-ui/types/collection-api/resources/MaterialSampleRunActionResult";
import { Head } from "../../../../../dina-ui/components/head";
import { Nav } from "../../../../../dina-ui/components/button-bar/nav/nav";
import { useAttachmentsModal } from "../../../../../dina-ui/components/object-store";
import { StorageLinkerField } from "../../../../../dina-ui/components/storage/StorageLinker";

export const SPLIT_CHILD_SAMPLE_RUN_ACTION_RESULT_KEY =
  "split-child-sample-run-action-result";

export default function SplitRunAction() {
  const { formatMessage } = useDinaIntl();
  const { save } = useApiClient();
  const { groupNames } = useAccount();
  const router = useRouter();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { openModal } = useModal();

  const {
    selectedMetadatas,
    attachedMetadatasUI: materialSampleAttachmentsUI
  } = useAttachmentsModal({
    initialMetadatas: [],
    deps: [],
    title: <DinaMessage id="materialSampleAttachments" />
  });

  const [enablePreparations, setEnablePreparations] = useState(true);
  const [enableStorage, setEnableStorage] = useState(true);

  // Add zebra-striping effect to the form sections. Every second top-level fieldset should have a grey background.
  useLayoutEffect(() => {
    const dataComponents = document?.querySelectorAll<HTMLDivElement>(
      ".data-components > fieldset:not(.d-none)"
    );
    dataComponents?.forEach((element, index) => {
      element.style.backgroundColor = index % 2 === 0 ? "#f3f3f3" : "";
    });
  });

  /** Wraps the useState setter with an AreYouSure modal when setting to false. */
  function dataComponentToggler(
    setBoolean: Dispatch<SetStateAction<boolean>>,
    componentName: string
  ) {
    return function toggleDataComponent(enabled: boolean) {
      if (!enabled) {
        // When removing data, ask the user for confirmation first:
        openModal(
          <AreYouSureModal
            actionMessage={
              <DinaMessage
                id="removeComponentData"
                values={{ component: componentName }}
              />
            }
            onYesButtonClicked={() => setBoolean(enabled)}
          />
        );
      } else {
        setBoolean(enabled);
      }
    };
  }

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

    // the first is the default value
    const defaultValueSample: MaterialSample = samplesToSave?.[0];

    for (const sample of samplesToSave) {
      delete sample.description;
      // link to parent
      if (parentSampleId) {
        sample.parentMaterialSample = {
          type: "material-sample",
          id: parentSampleId
        };
      }

      sample.relationships = {};

      if (sample.selectedMetadatas?.length) {
        (sample as any).relationships.attachment = {
          data: selectedMetadatas.map(it => ({ id: it.id, type: it.type }))
        };
        // Delete the 'attachment' attribute because it should stay in the relationships field:
        delete sample.attachment;
        delete sample.selectedMetadatas;
      }
    }
    samplesToSave.splice(0, 1);
    // save the other samples, taking the first as the default value
    const response = await save(
      samplesToSave.map(sample => ({
        resource: { ...defaultValueSample, ...sample },
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

    // formik.setFieldValue(
    //   commonRoot + "materialSampleName",
    //   parentSample?.materialSampleName
    // );

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

  function childSampleInternal(index, form) {
    const childSamplesPath = "childSamples";
    const childSamplePath = `${childSamplesPath}[${index}]`;
    const commonRoot = childSamplePath + ".";
    return (
      <>
        <span className="d-flex fw-bold flex-row">
          {formatMessage("materialSample") + " " + formatMessage("description")}
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
          onClick={() => {
            onCopyFromParent({ index, formik: form });
          }}
          className={`btn btn-secondary m-1 copyFromParent${index}`}
        >
          <DinaMessage id="copyFromParentLabel" />
        </FormikButton>

        <div className="d-flex">
          <div>
            <nav
              className="card card-body sticky-top d-none d-md-block"
              style={{ width: "20rem" }}
            >
              <h4>
                <DinaMessage id="formNavigation" />
              </h4>
              <div className="list-group">
                <a href="#identifiers-section" className="list-group-item">
                  <DinaMessage id="identifiers" />
                </a>
                {enablePreparations && (
                  <a href="#preparations-section" className="list-group-item">
                    <DinaMessage id="preparations" />
                  </a>
                )}
                {enableStorage && (
                  <a href="#storage-section" className="list-group-item">
                    <DinaMessage id="storage" />
                  </a>
                )}
                <a
                  href="#material-sample-attachments-section"
                  className="list-group-item"
                >
                  <DinaMessage id="materialSampleAttachments" />
                </a>
              </div>
            </nav>
            <div />
          </div>
          <div className="flex-grow-1 container-fluid">
            <MaterialSampleIdentifiersFormLayout
              namePrefix={commonRoot}
              className="flex-grow-1"
              index={index}
              sampleNamePlaceHolder={
                index > 0 ? computeDefaultSampleName(index - 1) : ""
              }
            />
            <FieldSet legend={<DinaMessage id="components" />}>
              <div className="row">
                <label className="enable-preparation d-flex align-items-center fw-bold col-sm-3">
                  <Switch
                    className="mx-2"
                    checked={enablePreparations}
                    onChange={dataComponentToggler(
                      setEnablePreparations,
                      formatMessage("preparations")
                    )}
                  />
                  <DinaMessage id="preparations" />
                </label>
                <label className="enable-storage d-flex align-items-center fw-bold col-sm-3">
                  <Switch
                    className="mx-2"
                    checked={enableStorage}
                    onChange={dataComponentToggler(
                      setEnableStorage,
                      formatMessage("storage")
                    )}
                  />
                  <DinaMessage id="storage" />
                </label>
              </div>
            </FieldSet>
            <div className="data-components">
              {enablePreparations && (
                <PreparationsFormLayout
                  namePrefix={commonRoot}
                  className="flex-grow-1 mx-1"
                />
              )}
              {enableStorage && (
                <div className="card card-body mb-3" id="storage-section">
                  <StorageLinkerField
                    name={`${commonRoot}storageUnit`}
                    customName="storageUnit"
                  />{" "}
                </div>
              )}
              {
                <div id="material-sample-attachments-section">
                  <Field name={`${commonRoot}selectedMetadatas`}>
                    {({}) => materialSampleAttachmentsUI}
                  </Field>
                </div>
              }
            </div>
          </div>
        </div>
      </>
    );
  }

  const samples = initialChildSamples;
  const sampleNameOptions = samples?.map(sample => ({
    label: sample.materialSampleName,
    value: sample.materialSampleName
  }));
  sampleNameOptions.unshift({ label: "Set All", value: "Set All" });
  const defaultSample: MaterialSample = { type: "material-sample" };
  samples.unshift(defaultSample);
  const length = samples.length;
  return (
    <div>
      <Head title={formatMessage("splitSubsampleTitle")} />
      <Nav />
      <main className="container-fluid">
        <h1>
          <DinaMessage id="splitSubsampleTitle" />
        </h1>
        <DinaForm
          initialValues={{
            childSamples: samples ?? [],
            childSampleName: "Set All"
          }}
        >
          <p>
            <span className="fw-bold">{formatMessage("description")}:</span>
            {formatMessage("splitSampleDescription")}
          </p>
          <p className="fw-bold">
            {formatMessage("stepLabel")}2: {formatMessage("dataEntryLabel")}
          </p>

          {length < 10 ? (
            <FieldArray name="childSamples">
              {({ form }) => {
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
                            return (
                              <TabPanel key={index}>
                                {childSampleInternal(index, form)}
                              </TabPanel>
                            );
                          })
                        : null}
                    </Tabs>
                  </div>
                );
              }}
            </FieldArray>
          ) : (
            <Field name="childSamples">
              {({ form }) => {
                return (
                  <>
                    <SelectFieldWithNav
                      form={form}
                      name="childSampleName"
                      options={sampleNameOptions as any}
                      onSelectionChanged={setSelectedIndex}
                    />
                    {childSampleInternal(selectedIndex, form)}
                  </>
                );
              }}
            </Field>
          )}
          {buttonBar}
        </DinaForm>
      </main>
    </div>
  );
}
