import useLocalStorage from "@rehooks/local-storage";
import {
  ButtonBar,
  CheckBoxWithoutWrapper,
  DinaForm,
  DinaFormSection,
  FieldSet,
  SelectField,
  SubmitButton,
  TextField,
  withResponse
} from "common-ui";
import { Field, FieldProps, FormikContextType, useFormikContext } from "formik";
import { padStart, range } from "lodash";
import { WithRouterProps } from "next/dist/client/with-router";
import { withRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";
import SpreadSheetColumn from "spreadsheet-column";
import NumberSpinnerField from "../../../../../common-ui/lib/formik-connected/NumberSpinnerField";
import { Nav } from "../../../../../dina-ui/components/button-bar/nav/nav";
import { useMaterialSampleQuery } from "../../../../../dina-ui/components/collection/useMaterialSample";
import { Head } from "../../../../../dina-ui/components/head";
import {
  BASE_NAME,
  MaterialSampleGenerationMode,
  MaterialSampleRunConfig,
  MaterialSampleRunConfigConfiguration,
  MATERIAL_SAMPLE_GENERATION_MODES,
  NUMERIC_UPPER_LIMIT,
  START,
  TYPE_LETTER,
  TYPE_NUMERIC
} from "../../../../../dina-ui/types/collection-api/resources/MaterialSampleRunConfig";
import { CollectionSelectField } from "../../../../components";
import { DinaMessage, useDinaIntl } from "../../../../intl/dina-ui-intl";

/* Props for computing suffix */
export interface ComputeSuffixProps {
  index: number;
  start: string | undefined;
  suffixType: string | undefined;
}

export const SPLIT_CHILD_SAMPLE_RUN_CONFIG_KEY =
  "split-child-sample-run-config";

type SuffixOptions = typeof TYPE_NUMERIC | typeof TYPE_LETTER;

const TYPE_OPTIONS: { label: string; value: SuffixOptions }[] = [
  {
    label: TYPE_NUMERIC,
    value: TYPE_NUMERIC
  },
  {
    label: TYPE_LETTER,
    value: TYPE_LETTER
  }
];

export function ConfigAction({ router }: WithRouterProps) {
  const { formatMessage } = useDinaIntl();
  const parentId = router.query.id?.toString();

  const materialSampleQuery = useMaterialSampleQuery(parentId as string);

  const [storedRunConfig, setStoredRunConfig] = useLocalStorage<
    MaterialSampleRunConfig | null | undefined
  >(SPLIT_CHILD_SAMPLE_RUN_CONFIG_KEY);

  const [generationMode, setGenerationMode] = useState(
    storedRunConfig?.configure?.generationMode ?? "BATCH"
  );

  const onSubmit = async ({ submittedValues: configActionFields }) => {
    const childSampleNames: string[] = [];
    for (let i = 0; i < configActionFields.numOfChildToCreate; i++) {
      childSampleNames.push(configActionFields?.sampleNames?.[i]);
    }

    const runConfig: MaterialSampleRunConfig = {
      metadata: {
        actionRemarks: configActionFields.remarks
      },
      configure: {
        generationMode,
        numOfChildToCreate: configActionFields.numOfChildToCreate,
        baseName: configActionFields.baseName ?? BASE_NAME,
        ...(generationMode === "BATCH" && {
          suffix: configActionFields.suffix
        }),
        ...(generationMode === "SERIES" && {
          start: configActionFields.start ?? START,
          suffixType: configActionFields.suffixType
        }),
        destroyOriginal: configActionFields.destroyOriginal,
        collection: configActionFields.collection || {
          id: null,
          type: "collection"
        }
      },
      configure_children: {
        sampleNames: childSampleNames
      }
    };

    // save the runConfig to local storage
    setStoredRunConfig(runConfig);
    await router?.push(`/collection/material-sample/workflows/split-run`);
  };

  const buttonBar = (
    <ButtonBar className="d-flex justify-content-center">
      <SubmitButton className="btn btn-info" hidePrimaryClass={true}>
        <DinaMessage id="next" />
      </SubmitButton>
    </ButtonBar>
  );

  const initialConfig = storedRunConfig?.configure ?? {
    suffixType: TYPE_NUMERIC,
    numOfChildToCreate: 1,
    start: "001"
  };

  const initialConfigChild = storedRunConfig?.configure_children;

  return (
    <div>
      <Head title={formatMessage("splitSubsampleTitle")} />
      <Nav />
      {withResponse(materialSampleQuery, ({ data: parentSample }) => {
        const computedInitConfigValues = {
          ...initialConfig,
          ...initialConfigChild,
          baseName: parentSample.materialSampleName || "",
          collection: parentSample.collection || undefined
        };

        return (
          <main className="container">
            <h1 id="wb-cont">
              <DinaMessage id="splitSubsampleTitle" />
            </h1>
            <h2>{parentSample.materialSampleName}</h2>
            <DinaForm
              initialValues={computedInitConfigValues}
              onSubmit={onSubmit}
            >
              <p>
                <span className="fw-bold">{formatMessage("description")}:</span>
                {formatMessage("splitSampleDescription")}
              </p>
              <FieldSet
                legend={<DinaMessage id="splitSampleActionMetadataLegend" />}
              >
                <TextField
                  name="remarks"
                  multiLines={true}
                  placeholder={formatMessage("splitSampleRemarksPlaceholder")}
                />
              </FieldSet>
              <p className="fw-bold">
                {formatMessage("stepLabel")}1: {formatMessage("configureLabel")}
              </p>
              <FieldSet legend={<DinaMessage id="splitSampleConfigLegend" />}>
                <label className="d-flex align-items-center gap-2 fw-bold mb-3">
                  {formatMessage("splitSampleChildSamplesToCreateLabel")}
                  {": "}
                  <div style={{ width: "10rem" }}>
                    <NumberSpinnerField
                      name="numOfChildToCreate"
                      max={NUMERIC_UPPER_LIMIT}
                      removeLabel={true}
                      removeBottomMargin={true}
                    />
                  </div>
                </label>
                <Tabs
                  selectedIndex={MATERIAL_SAMPLE_GENERATION_MODES.indexOf(
                    generationMode
                  )}
                  onSelect={index =>
                    setGenerationMode(MATERIAL_SAMPLE_GENERATION_MODES[index])
                  }
                >
                  <TabList>
                    <Tab className={`react-tabs__tab batch-tab`}>
                      <DinaMessage id="generateBatch" />
                    </Tab>
                    <Tab className={`react-tabs__tab series-tab`}>
                      <DinaMessage id="generateSeries" />
                    </Tab>
                  </TabList>
                  <TabPanel>
                    <SplitConfigFormFields generationMode={generationMode} />
                  </TabPanel>
                  <TabPanel>
                    <SplitConfigFormFields generationMode={generationMode} />
                  </TabPanel>
                </Tabs>
              </FieldSet>
              {buttonBar}
            </DinaForm>
          </main>
        );
      })}
    </div>
  );
}

function SplitChildHeader() {
  return (
    <div className="d-flex">
      <span className="col-md-1" />
      <span className="col-md-3 fw-bold">
        <DinaMessage id="name" />
      </span>
    </div>
  );
}

export function computeSuffix({
  index,
  start,
  suffixType
}: ComputeSuffixProps) {
  if (suffixType === TYPE_NUMERIC) {
    const suffixLength = start?.length ?? 3;
    // correclty set the start when numerical input is null/empty, default to 1
    const suffixNumber = isNaN(parseInt(start as any, 10))
      ? index + 1
      : index + parseInt(start as any, 10);

    return padStart(String(suffixNumber), suffixLength, "0");
  } else {
    let myStart = start;
    // Correclty set the start value when letter input is null/empty, defualt to "A"
    if (!myStart || myStart.length === 0 || !isNaN(parseInt(myStart, 10))) {
      myStart = "A";
    }
    const sc = new SpreadSheetColumn();
    return sc.fromInt(index + sc.fromStr(myStart)) as string;
  }
}

interface SplitChildRowProps {
  index: number;
  baseName: string;
  computedSuffix: string;
}

function SplitChildRow({ index }: SplitChildRowProps) {
  return (
    <div className="d-flex">
      <span className="col-md-1 fw-bold">#{index + 1}:</span>
      <TextField
        className={`col-md-3 sampleNames${index}`}
        hideLabel={true}
        name={`sampleNames[${index}]`}
      />
    </div>
  );
}

function computingSuffix(generationMode, suffix, index, start, suffixType) {
  return generationMode === "BATCH"
    ? suffix || ""
    : generationMode === "SERIES"
    ? `${computeSuffix({
        index,
        start,
        suffixType
      })}`
    : "";
}

/**
 * Sets the default sample names automatically when the generation inputs change,
 * or when the user manually resets them.
 */
function useDefaultSampleNames(generationMode: MaterialSampleGenerationMode) {
  const formikCtx = useFormikContext<MaterialSampleRunConfigConfiguration>();

  function resetSampleNames() {
    const newValues = { ...formikCtx.values };
    const { suffix, start, suffixType, baseName, numOfChildToCreate } =
      newValues;
    range(0, numOfChildToCreate).map(index => {
      const computedSuffix = computingSuffix(
        generationMode,
        suffix,
        index,
        start,
        suffixType
      );
      formikCtx.setFieldValue(
        `sampleNames[${index}]`,
        `${baseName || BASE_NAME}${computedSuffix}`
      );
      formikCtx.setFieldTouched(`sampleNames[${index}]`, false);
    });
  }

  useEffect(
    // Set the child sample names based on all current state of affecting fields' values
    resetSampleNames,
    [
      formikCtx.values.numOfChildToCreate,
      formikCtx.values.baseName,
      formikCtx.values.suffixType,
      formikCtx.values.suffix,
      formikCtx.values.numOfChildToCreate,
      formikCtx.values.start
    ]
  );

  const sampleNamesWereEdited = !!(formikCtx.touched as any).sampleNames?.some(
    it => it
  );

  return { resetSampleNames, sampleNamesWereEdited };
}

interface SplitConfigFormProps {
  generationMode: MaterialSampleGenerationMode;
}

function SplitConfigFormFields({ generationMode }: SplitConfigFormProps) {
  const { formatMessage } = useDinaIntl();

  const { resetSampleNames, sampleNamesWereEdited } =
    useDefaultSampleNames(generationMode);

  return (
    <div>
      <CheckBoxWithoutWrapper
        name="destroyOriginal"
        includeAllLabel={formatMessage("destroyOriginal")}
      />
      <div className="row">
        <div className="col-md-3">
          <CollectionSelectField name="collection" />
          <TextField name="baseName" />
        </div>
        {generationMode === "BATCH" && (
          <TextField
            name="suffix"
            className="col-md-3"
            label={<DinaMessage id="suffixOptional" />}
          />
        )}
        {generationMode === "SERIES" && (
          <>
            <SelectField
              className="col-md-3"
              name="suffixType"
              options={TYPE_OPTIONS}
              onChange={(newType, formik) => {
                formik.setFieldValue(
                  "start",
                  newType === "Numerical" ? "001" : "A"
                );
              }}
            />
            <Field name="suffixType">
              {({ field: { value: suffixType } }) => (
                <TextField
                  className="col-md-2"
                  // Select all text on click:
                  inputProps={{
                    onClick: e => (e.target as any).select()
                  }}
                  name="start"
                  numberOnly={suffixType === "Numerical"}
                  letterOnly={suffixType === "Letter"}
                />
              )}
            </Field>
          </>
        )}
      </div>
      <div>
        <div className="alert alert-warning d-inline-block">
          <DinaMessage id="splitSampleInstructions" />
        </div>
        <div className="d-flex gap-3 mb-3">
          <h4>
            <DinaMessage id="previewAndCustomizeLabel" />
          </h4>
          {sampleNamesWereEdited && (
            <button
              className="btn btn-dark reset-sample-names"
              type="button"
              onClick={resetSampleNames}
            >
              <DinaMessage id="resetNamesToDefaultValues" />
            </button>
          )}
        </div>
        <SplitChildHeader />
        <Field name="start">
          {({
            form: {
              values: {
                start,
                suffix,
                suffixType,
                numOfChildToCreate,
                baseName
              }
            }
          }) =>
            range(0, numOfChildToCreate).map(index => {
              const computedSuffix = computingSuffix(
                generationMode,
                suffix,
                index,
                start,
                suffixType
              );
              return (
                <SplitChildRow
                  key={
                    generationMode === "BATCH"
                      ? `${baseName}-${computedSuffix}-${index}`
                      : `${baseName}-${computedSuffix}`
                  }
                  index={index}
                  baseName={baseName}
                  computedSuffix={computedSuffix}
                />
              );
            })
          }
        </Field>
      </div>
    </div>
  );
}

export default withRouter(ConfigAction);
