import useLocalStorage from "@rehooks/local-storage";
import {
  ButtonBar,
  CheckBoxWithoutWrapper,
  DinaForm,
  FieldSet,
  SelectField,
  SubmitButton,
  TextField
} from "../../../../../common-ui";
import { Field } from "formik";
import { padStart, range } from "lodash";
import { useRouter } from "next/router";
import React from "react";
import SpreadSheetColumn from "spreadsheet-column";
import NumberSpinnerField from "../../../../../common-ui/lib/formik-connected/NumberSpinnerField";
import { Nav } from "../../../../../dina-ui/components/button-bar/nav/nav";
import { Head } from "../../../../../dina-ui/components/head";
import {
  BASE_NAME,
  IDENTIFIER_TYPE_OPTIONS,
  MaterialSampleRunConfig,
  NUMERIC_UPPER_LIMIT,
  START,
  TYPE_LETTER,
  TYPE_NUMERIC
} from "../../../../../dina-ui/types/collection-api/resources/MaterialSampleRunConfig";
import { DinaMessage, useDinaIntl } from "../../../../intl/dina-ui-intl";

/* Props for computing suffix */
export interface ComputeSuffixProps {
  index: number;
  start: string | undefined;
  suffixType: string | undefined;
}

export const SPLIT_CHILD_SAMPLE_RUN_CONFIG_KEY =
  "split-child-sample-run-config";

export default function ConfigAction() {
  const { formatMessage } = useDinaIntl();
  const router = useRouter();
  const [splitChildSampleRunConfig, setSplitChildSampleRunConfig] =
    useLocalStorage<MaterialSampleRunConfig | null | undefined>(
      SPLIT_CHILD_SAMPLE_RUN_CONFIG_KEY
    );
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
  const SplitChildHeader = () => (
    <div className="d-flex">
      <span className="col-md-1" />
      <span className="col-md-3 fw-bold">{formatMessage("name")}</span>
      <span className="col-md-3 fw-bold">{formatMessage("description")}</span>
    </div>
  );

  const onSubmit = async ({ submittedValues: configActionFields }) => {
    const childSampleNames: string[] = [];
    const childSampleDescs: string[] = [];
    for (let i = 0; i < configActionFields.numOfChildToCreate; i++) {
      childSampleNames.push(configActionFields?.sampleName?.[i]);
      childSampleDescs.push(configActionFields?.sampleDesc?.[i]);
    }

    const runConfig: MaterialSampleRunConfig = {
      metadata: {
        actionRemarks: configActionFields.remarks
      },
      configure: {
        identifier: configActionFields.identifier,
        numOfChildToCreate:
          configActionFields.numOfChildToCreate ??
          configActionFields.numOfChildToCreate,
        baseName: configActionFields.baseName ?? BASE_NAME,
        start: configActionFields.start ?? START,
        suffixType: configActionFields.suffixType,
        destroyOriginal: configActionFields.destroyOriginal
      },
      configure_children: {
        sampleNames: childSampleNames,
        sampleDescs: childSampleDescs
      }
    };

    // save the runConfig to local storage
    setSplitChildSampleRunConfig(runConfig);
    await router?.push(`/collection/material-sample/workflows/split-run`);
  };

  const buttonBar = (
    <ButtonBar className="d-flex justify-content-center">
      <SubmitButton className="btn btn-info" hidePrimaryClass={true}>
        <DinaMessage id="next" />
      </SubmitButton>
    </ButtonBar>
  );

  const initialConfig = splitChildSampleRunConfig?.configure ?? {
    suffixType: TYPE_NUMERIC,
    numOfChildToCreate: 1,
    start: "001",
    identifier: "MATERIAL_SAMPLE_ID"
  };

  const initialConfigChild = splitChildSampleRunConfig?.configure_children;

  return (
    <div>
      <Head title={formatMessage("splitSubsampleTitle")} />
      <Nav />
      <main className="container-fluid">
        <h1>
          <DinaMessage id="splitSubsampleTitle" />
        </h1>
        <DinaForm
          initialValues={{ ...initialConfig, ...initialConfigChild }}
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
            <span className="fw-bold">
              {formatMessage("splitSampleChildSamplesToCreateLabel")}{" "}
            </span>
            <div className="row">
              <NumberSpinnerField
                name="numOfChildToCreate"
                className="col-md-2"
                onChange={(newValue, formik) =>
                  formik.setFieldValue("numOfChildToCreate", newValue)
                }
                hideLabel={true}
                max={NUMERIC_UPPER_LIMIT}
              />
              <div className="col-md-4">
                <CheckBoxWithoutWrapper
                  name="destroyOriginal"
                  includeAllLabel={formatMessage("destroyOriginal")}
                />
              </div>
            </div>
            <div className="row">
              <SelectField
                className="col-md-2"
                name="identifier"
                options={IDENTIFIER_TYPE_OPTIONS.map(({ labelKey, value }) => ({
                  label: formatMessage(labelKey),
                  value
                }))}
              />

              <TextField
                className="col-md-2"
                name="baseName"
                placeholder={`${BASE_NAME}`}
              />
              <SelectField
                className="col-md-2 suffixType"
                name="suffixType"
                options={TYPE_OPTIONS}
                onChange={(newType, formik) =>
                  formik.setFieldValue(
                    "start",
                    newType === "Numerical" ? "001" : "A"
                  )
                }
              />
              <Field name="suffixType">
                {({ field: { value: suffixType } }) => (
                  <TextField
                    className="col-md-2"
                    // Select all text on click:
                    inputProps={{ onClick: e => (e.target as any).select() }}
                    name="start"
                    numberOnly={suffixType === "Numerical"}
                    letterOnly={suffixType === "Letter"}
                  />
                )}
              </Field>
            </div>
            <div>
              <div className="alert alert-warning d-inline-block">
                <DinaMessage id="splitSampleInstructions" />
              </div>
              <SplitChildHeader />
              <Field name="start">
                {({
                  form: {
                    values: { start, suffixType, numOfChildToCreate, baseName }
                  }
                }) =>
                  range(0, numOfChildToCreate).map(index => {
                    const suffix = computeSuffix({
                      index,
                      start,
                      suffixType
                    });
                    return (
                      <SplitChildRow
                        key={`${baseName}-${suffix}`}
                        index={index}
                        baseName={baseName}
                        computedSuffix={suffix}
                      />
                    );
                  })
                }
              </Field>
            </div>
          </FieldSet>
          {buttonBar}
        </DinaForm>
      </main>
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
    return sc.fromInt(index + sc.fromStr(myStart));
  }
}

interface SplitChildRowProps {
  index: number;
  baseName: string;
  computedSuffix: string;
}

function SplitChildRow({
  index,
  baseName,
  computedSuffix
}: SplitChildRowProps) {
  return (
    <div className="d-flex">
      <span className="col-md-1 fw-bold">#{index + 1}:</span>
      <TextField
        className={`col-md-3 sampleName${index}`}
        hideLabel={true}
        name={`sampleName[${index}]`}
        placeholder={
          baseName
            ? `${baseName}-${computedSuffix}`
            : `${BASE_NAME}-${computedSuffix}`
        }
      />
      <TextField
        className="col-md-3"
        hideLabel={true}
        name={`description[${index}]`}
      />
    </div>
  );
}
