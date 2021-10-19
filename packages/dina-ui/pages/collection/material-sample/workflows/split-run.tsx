import useLocalStorage from "@rehooks/local-storage";
import {
  AreYouSureModal,
  ButtonBar,
  DinaForm,
  FieldSet,
  FormikButton,
  LoadingSpinner,
  SelectFieldWithNav,
  useAccount,
  useApiClient,
  useModal,
  useQuery
} from "common-ui";
import { Field, FieldArray } from "formik";
import { isArray, omitBy, range, omit } from "lodash";
import { useRouter } from "next/router";
import React, {
  Dispatch,
  SetStateAction,
  useLayoutEffect,
  useState
} from "react";
import Switch from "react-switch";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";
import { Nav } from "../../../../../dina-ui/components/button-bar/nav/nav";
import { Head } from "../../../../../dina-ui/components/head";
import { useAttachmentsModal } from "../../../../../dina-ui/components/object-store";
import { StorageLinkerField } from "../../../../../dina-ui/components/storage/StorageLinker";
import {
  DinaMessage,
  useDinaIntl
} from "../../../../../dina-ui/intl/dina-ui-intl";
import { MaterialSample } from "../../../../../dina-ui/types/collection-api";
import { MaterialSampleRunActionResult } from "../../../../../dina-ui/types/collection-api/resources/MaterialSampleRunActionResult";
import {
  BASE_NAME,
  MaterialSampleRunConfig,
  START,
  TYPE_NUMERIC
} from "../../../../../dina-ui/types/collection-api/resources/MaterialSampleRunConfig";
import {
  BLANK_PREPARATION,
  PreparationField
} from "../../../../components/collection/PreparationField";
import { MaterialSampleIdentifiersFormLayout } from "../edit";
import {
  computeSuffix,
  SPLIT_CHILD_SAMPLE_RUN_CONFIG_KEY
} from "./split-config";

import { WithRouterProps } from "next/dist/client/with-router";
import { withRouter } from "next/router";

export const SPLIT_CHILD_SAMPLE_RUN_ACTION_RESULT_KEY =
  "split-child-sample-run-action-result";

export function SplitRunAction({ router }: WithRouterProps) {
  const parentId = router.query.id?.toString();
  // Load from local storage the run config
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
    generationMode = "SERIES",
    collection
  } = splitChildSampleRunConfig?.configure ?? {};

  const { sampleNames = [] } =
    splitChildSampleRunConfig?.configure_children ?? {};

  const initialChildSamples: MaterialSample[] = [];

  const { formatMessage } = useDinaIntl();
  const { save } = useApiClient();
  const { groupNames } = useAccount();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { openModal } = useModal();

  const {
    selectedMetadatas,
    attachedMetadatasUI: materialSampleAttachmentsUI
  } = useAttachmentsModal({
    initialMetadatas: [],
    deps: [],
    index: selectedIndex.toString(),
    title: <DinaMessage id="materialSampleAttachments" />,
    id: "material-sample-attachments-section"
  });

  /* Initialize the prepatation and storage for all pages including default to be open by default */
  const prepMap = new Map<string, boolean>();
  const storageMap = new Map<string, boolean>();
  range(0, numOfChildToCreate + 1).map(num => {
    prepMap.set(num.toString(), true);
    storageMap.set(num.toString(), true);
  });

  const [enablePreparations, setEnablePreparations] =
    useState<Map<string, boolean>>(prepMap);
  const [enableStorage, setEnableStorage] =
    useState<Map<string, boolean>>(storageMap);

  // Add zebra-striping effect to the form sections. Every second top-level fieldset should have a grey background.
  useLayoutEffect(() => {
    const dataComponents = document?.querySelectorAll<any>(
      ".data-components > fieldset:not(.d-none)"
    );
    dataComponents?.forEach((element, index) => {
      element.style.backgroundColor = index % 2 === 0 ? "#f3f3f3" : "";
    });
  });

  /** Wraps the useState setter with an AreYouSure modal when setting to false. */
  function dataComponentToggler(
    setBoolean: Dispatch<SetStateAction<Map<string, boolean>>>,
    componentName: string,
    index: string
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
            onYesButtonClicked={() => {
              setBoolean(prev => new Map(prev).set(index, enabled));
            }}
          />
        );
      } else {
        setBoolean(prev => new Map(prev).set(index, enabled));
      }
    };
  }

  // Retrive the parent material sample upfront
  const { loading, response: parentResp } = useQuery<MaterialSample>({
    path: `collection-api/material-sample/${parentId}`,
    include: "preparationType,materialSampleType"
  });

  if (loading) {
    return <LoadingSpinner loading={true} />;
  }

  const parentSample = parentResp?.data;
  const parentSampleId = parentSample?.id ?? null;

  // Get form initial values from run config
  for (let i = 0; i < numOfChildToCreate; i++) {
    // populate initial childsamples when the computed suffix has value, handle when there are disconnected letter suffix
    const computedSuffix = computeSuffix({ index: i, start, suffixType });

    const splitChildSampleName = sampleNames[i];

    const generatedSampleName =
      generationMode === "BATCH"
        ? `${baseName}${suffix}`
        : `${baseName}${computedSuffix}`;

    initialChildSamples.push({
      group: groupNames?.[0],
      type: "material-sample",
      materialSampleName: splitChildSampleName ?? generatedSampleName,
      collection
    });
  }

  const onSubmit = async submittedValues => {
    const sampleRunActionResults: MaterialSampleRunActionResult = {
      parentSampleId: parentSampleId as string,
      childrenGenerated: []
    };
    // the first is the default value
    const [defaultValueSample, ...samplesToSave] = submittedValues.childSamples;

    const defaultValues = {
      // link to parent
      ...(parentSampleId && {
        parentMaterialSample: { type: "material-sample", id: parentSampleId }
      }),
      // Re-use the publiclyReleasable value from the parent. TODO review this:
      publiclyReleasable: parentSample?.publiclyReleasable,

      ...omitBy(defaultValueSample, isBlankResourceAttribute)
    };

    const saveInputs = samplesToSave.map((sample, index) => {
      const tabIndex = String(index + 1);
      return {
        resource: {
          // Apply the default "Set All" values:
          ...defaultValues,

          // Apply the manually inputted values:
          ...omitBy(sample, isBlankResourceAttribute),

          // Only persist the preparation fields if the preparations toggle is enabled:
          ...(!enablePreparations.get(tabIndex) && BLANK_PREPARATION),

          // Only persist the Storage Unit field if the Storage Unit toggle is enabled:
          ...(!enableStorage.get(tabIndex) && {
            storageUnit: { id: null, type: "storage-unit" }
          }),

          // Apply default attachment or manual attachments if any:
          relationships: {
            attachment: {
              data: selectedMetadatas?.get(tabIndex)?.length
                ? selectedMetadatas?.get(tabIndex)
                : selectedMetadatas?.get("0") ?? []
            }
          }
        },
        type: "material-sample"
      };
    });

    // save samples
    const response = await save<MaterialSample>(saveInputs, {
      apiBaseUrl: "/collection-api"
    });

    response.map((resp, idx) =>
      sampleRunActionResults.childrenGenerated?.push({
        id: resp.id,
        name:
          samplesToSave[idx].materialSampleName || computeDefaultSampleName(idx)
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
      <PreviousButton />
      <FormikButton className="btn btn-info runAction" onClick={onSubmit}>
        <DinaMessage id="next" />
      </FormikButton>
    </ButtonBar>
  );

  const onCopyFromParent = ({ index, formik }) => {
    const childSamplesPath = "childSamples";
    const childSamplePath = `${childSamplesPath}[${index}]`;
    const commonRoot = childSamplePath + ".";
    // Use the first one from return til material sample name is unuque
    if (parentSample) {
      const keys: (keyof MaterialSample)[] = Object.keys(
        omit(parentSample, ["id", "materialSampleName", "collectingEvent"])
      ) as any;
      for (const fieldName of keys) {
        formik.setFieldValue(commonRoot + fieldName, parentSample?.[fieldName]);
      }
      formik.setFieldValue(
        commonRoot + "dwcOtherCatalogNumbers",
        parentSample?.dwcOtherCatalogNumbers
      );
    }
  };

  function computeDefaultSampleName(index) {
    return (
      initialChildSamples[index + 1].materialSampleName ??
      baseName + computeSuffix({ index, start, suffixType })
    );
  }

  function childSampleInternal(index, form) {
    const childSamplesPath = "childSamples";
    const childSamplePath = `${childSamplesPath}[${index}]`;
    const commonRoot = childSamplePath + ".";

    return (
      <>
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
                {enablePreparations.get(index.toString()) && (
                  <a href="#preparations-section" className="list-group-item">
                    <DinaMessage id="preparations" />
                  </a>
                )}
                {enableStorage.get(index.toString()) && (
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
              disableSampleName={true}
              namePrefix={commonRoot}
              className="flex-grow-1"
              sampleNamePlaceHolder={
                index === 0
                  ? formatMessage("multiple")
                  : computeDefaultSampleName(index - 1)
              }
            />
            <FieldSet legend={<DinaMessage id="components" />}>
              <div className="row">
                <label className="enable-preparation d-flex align-items-center fw-bold col-sm-3">
                  <Switch
                    className="mx-2"
                    checked={!!enablePreparations.get(index.toString())}
                    onChange={dataComponentToggler(
                      setEnablePreparations,
                      formatMessage("preparations"),
                      index.toString()
                    )}
                  />
                  <DinaMessage id="preparations" />
                </label>
                <label className="enable-storage d-flex align-items-center fw-bold col-sm-3">
                  <Switch
                    className="mx-2"
                    checked={!!enableStorage.get(index.toString())}
                    onChange={dataComponentToggler(
                      setEnableStorage,
                      formatMessage("storage"),
                      index.toString()
                    )}
                  />
                  <DinaMessage id="storage" />
                </label>
              </div>
            </FieldSet>
            <div className="data-components">
              {enablePreparations.get(index.toString()) && (
                <PreparationField
                  namePrefix={commonRoot}
                  className="flex-grow-1 mx-1"
                />
              )}
              {enableStorage.get(index.toString()) && (
                <FieldSet
                  id="storage-section"
                  legend={<DinaMessage id="storage" />}
                >
                  <StorageLinkerField
                    name={`${commonRoot}storageUnit`}
                    customName="storageUnit"
                  />{" "}
                </FieldSet>
              )}
              {materialSampleAttachmentsUI}
            </div>
          </div>
        </div>
      </>
    );
  }

  const samples = initialChildSamples;
  const sampleNameOptions = samples?.map((sample, idx) => ({
    label: sample.materialSampleName,
    value: idx + (sample.materialSampleName as any)
  }));
  sampleNameOptions.unshift({
    label: formatMessage("setAll"),
    value: "Set All"
  });
  const defaultSample: MaterialSample = { type: "material-sample" };
  samples.unshift(defaultSample);
  const length = samples?.length;
  return (
    <div>
      <Head title={formatMessage("splitSubsampleTitle")}
						lang={formatMessage("languageOfPage")} 
						creator={formatMessage("agricultureCanada")}
						subject={formatMessage("subjectTermsForPage")} />
			<Nav />
      <main className="container">
        <h1 id="wb-cont">
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

          {length < 11 ? (
            <FieldArray name="childSamples">
              {({ form }) => {
                return (
                  <div className="child-sample-section">
                    <Tabs
                      selectedIndex={selectedIndex}
                      onSelect={setSelectedIndex}
                    >
                      {
                        <TabList>
                          {samples.map((_, index) => (
                            <Tab
                              key={index}
                              className={`${
                                index === 0
                                  ? "react-tabs__tab set-all-tab"
                                  : "react-tabs__tab sample-tab-" + (index - 1)
                              }`}
                            >
                              <span className="m-3">
                                {index === 0
                                  ? formatMessage("setAll")
                                  : computeDefaultSampleName(index - 1)}
                              </span>
                            </Tab>
                          ))}
                        </TabList>
                      }
                      {samples?.length
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
              {({ form }) => (
                <>
                  <SelectFieldWithNav
                    form={form}
                    name="childSampleName"
                    options={sampleNameOptions as any}
                    onSelectionChanged={setSelectedIndex}
                    className="col-md-4"
                    hideLabel={true}
                  />
                  {childSampleInternal(selectedIndex, form)}
                </>
              )}
            </Field>
          )}
          {buttonBar}
        </DinaForm>
      </main>
    </div>
  );
}

/** "Previous" button with an AreYouSure confirmation modal. */
function PreviousButton() {
  const { openModal } = useModal();
  const router = useRouter();

  function openPreviousButtonModal() {
    return openModal(
      <AreYouSureModal
        actionMessage={<DinaMessage id="goToThePreviousStep" />}
        messageBody={<DinaMessage id="thisWillLoseAllDataEnteredInThisStep" />}
        onYesButtonClicked={async () => {
          await router.push(
            "/collection/material-sample/workflows/split-config"
          );
        }}
      />
    );
  }

  return (
    <FormikButton
      className="btn btn-secondary previous-button"
      onClick={openPreviousButtonModal}
    >
      <DinaMessage id="previous" />
    </FormikButton>
  );
}

/** CHecks whether an API resource's attribute is blank */
function isBlankResourceAttribute(value: any) {
  // "blank" means something different depending on the type:
  switch (typeof value) {
    case "string":
      // Empty string:
      return !value.trim();
    case "object":
    case "undefined":
      // empty object or empty array:
      return isArray(value) ? !value.join() : !value?.id;
    default:
      return false;
  }
}

export default withRouter(SplitRunAction);
