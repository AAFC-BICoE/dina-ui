import useLocalStorage from "@rehooks/local-storage";
import { useRouter } from "next/router";
import {
  ButtonBar,
  CheckBoxWithoutWrapper,
  DinaForm,
  FieldSet,
  SelectField,
  SubmitButton,
  TextField
} from "common-ui";
import NumberSpinnerField from "../../../../../common-ui/lib/formik-connected/NumberSpinnerField";
import {
  MaterialSampleRunConfig,
  BASE_NAME,
  START,
  TYPE_LETTER,
  TYPE_NUMERIC
} from "../../../../../dina-ui/types/collection-api/resources/MaterialSampleRunConfig";
import React, { useState } from "react";
import { DinaMessage, useDinaIntl } from "../../../../intl/dina-ui-intl";
import { Nav } from "../../../../../dina-ui/components/button-bar/nav/nav";
import { Head } from "../../../../../dina-ui/components/head";

interface SplitChildRowProps {
  index: number;
  baseName: string;
  computedSuffix: string;
}

/* Config action related fields */
interface RunConfig {
  numOfChildToCreate: number;
  baseName: string;
  start: string;
  sufficType: string;
  customChildSample?: { index: number; name: string; description: string }[];
}

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
  const [numOfChildToCreate, setNumOfChildToCreate] = useState(1);
  const [baseName, setBaseName] = useState("");
  const [suffixType, setSuffixType] = useState(TYPE_NUMERIC);
  const [start, setStart] = useState(suffixType === TYPE_NUMERIC ? "1" : "A");
  const router = useRouter();

  const [_, setSplitChildSampleRunConfig] = useLocalStorage<
    MaterialSampleRunConfig | null | undefined
  >(SPLIT_CHILD_SAMPLE_RUN_CONFIG_KEY);

  const onCreatedChildSplitSampleChange = value => {
    setNumOfChildToCreate(value);
  };

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

  const SplitChildRow = ({
    index,
    baseName: sampleSrcName,
    computedSuffix
  }: SplitChildRowProps) => {
    return (
      <div className="d-flex">
        <span className="col-md-1 fw-bold">#{index + 1}:</span>
        <TextField
          className={`col-md-3 sampleName${index}`}
          hideLabel={true}
          name={`sampleName[${index}]`}
          placeholder={
            sampleSrcName
              ? `${sampleSrcName}-${computedSuffix}`
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
  };
  const SplitChildRows = () => {
    const childRows: any = [];
    for (let i = 0; i < numOfChildToCreate; i++) {
      const computedSuffix = computeSuffix({ index: i, start, suffixType });
      childRows.push(
        <SplitChildRow
          key={i}
          index={i}
          baseName={baseName}
          computedSuffix={computedSuffix}
        />
      );
    }
    return childRows;
  };

  const onSubmit = async ({ submittedValues: configActionFields }) => {
    // record the customized user entry if there is any name or description provided
    const sampleNames: any = [];
    const sampleDescs: any = [];
    if (configActionFields.sampleName || configActionFields.description) {
      for (let i = 0; i < numOfChildToCreate; i++) {
        sampleNames.push(configActionFields.sampleName?.[i]);
        sampleDescs.push(configActionFields.description?.[i]);
      }
    }
    const runConfig: MaterialSampleRunConfig = {
      metadata: {
        actionRemarks: configActionFields.remarks
      },
      configure: {
        numOfChildToCreate:
          configActionFields.numOfChildToCreate ?? numOfChildToCreate,
        baseName: configActionFields.baseName ?? BASE_NAME,
        start: configActionFields.start ?? START,
        suffixType: configActionFields.suffixType,
        destroyOriginal: configActionFields.destroyOriginal
      },
      configure_children: {
        sampleNames,
        sampleDescs
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

  const onChangeExternal = (value, formik) => {
    setSuffixType(value as any);
    // Make sure the placeholder is updated properly by simulating update the field value
    formik.values.start === null
      ? formik.setFieldValue("start", "")
      : formik.setFieldValue("start", null);
    isLetterType ? setStart("A") : setStart("1");
  };

  const isNumericalType = suffixType === TYPE_NUMERIC;
  const isLetterType = suffixType === TYPE_LETTER;

  return (
    <div>
      <Head title={formatMessage("splitSubsampleTitle")} />
      <Nav />
      <main className="container-fluid">
        <h1>
          <DinaMessage id="splitSubsampleTitle" />
        </h1>
        <DinaForm
          initialValues={{ suffixType: TYPE_NUMERIC }}
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
                onChange={onCreatedChildSplitSampleChange}
                hideLabel={true}
                defaultValue={numOfChildToCreate}
              />
              <div className="col-md-4">
                <CheckBoxWithoutWrapper
                  name="destroyOriginal"
                  includeAllLabel={formatMessage("destroyOriginal")}
                />
              </div>
            </div>
            <div className="row">
              <TextField
                className="col-md-2"
                name="baseName"
                placeholder={`${BASE_NAME}`}
                onChangeExternal={(_form, _name, value) =>
                  setBaseName(value as any)
                }
              />
              <SelectField
                className="col-md-2"
                name="suffixType"
                options={TYPE_OPTIONS}
                onChange={onChangeExternal}
              />
              <TextField
                className="col-md-2"
                name="start"
                placeholder={isNumericalType ? "001" : "A"}
                numberOnly={isNumericalType ?? false}
                letterOnly={isLetterType ?? false}
                inputProps={{ maxLength: isLetterType ? 1 : Infinity }}
                onChangeExternal={(_form, _name, value) => {
                  setStart(!value ? (isNumericalType ? "1" : "A") : value);
                }}
              />
            </div>
            <div>
              <div className="alert alert-warning d-inline-block">
                <DinaMessage id="splitSampleInstructions" />
              </div>
              <SplitChildHeader />
              <SplitChildRows />
            </div>
          </FieldSet>
          {buttonBar}
        </DinaForm>
      </main>
    </div>
  );
}

export const computeSuffix = ({
  index,
  start,
  suffixType
}: ComputeSuffixProps) => {
  let computedSuffix;
  if (suffixType === TYPE_NUMERIC) {
    // correclty set the start when numerical input is null/empty, default to 1
    computedSuffix = isNaN(parseInt(start as any, 10))
      ? index + 1
      : index + parseInt(start as any, 10);
  } else {
    let myStart = start;
    // Correclty set the start value when letter input is null/empty, defualt to "A"
    if (!myStart || myStart.length === 0 || !isNaN(parseInt(myStart, 10))) {
      myStart = "A";
    }
    const charCode = myStart.charCodeAt(0) + index;
    // Only if the char is a letter, split child row will be added
    if (
      (charCode >= 97 && charCode <= 122) ||
      (charCode >= 65 && charCode <= 90)
    ) {
      computedSuffix = String.fromCharCode(charCode);
    }
  }
  return computedSuffix;
};
