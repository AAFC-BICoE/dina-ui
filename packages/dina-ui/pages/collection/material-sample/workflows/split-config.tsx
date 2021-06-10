import useLocalStorage from "@rehooks/local-storage";
import { object, SchemaOf, string } from "yup";
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
  MaterialSampleRunConfigConfiguration
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
  type: string;
  customChildSample?: { index: number; name: string; description: string }[];
}

export interface ComputeSuffixProps {
  index: number;
  start: string | undefined;
  type: string | undefined;
}

export const SPLIT_CHILD_SAMPLE_RUN_CONFIG_KEY =
  "split-child-sample-run-config";

export default function ConfigAction(props) {
  const { nextStep } = props;
  const { formatMessage } = useDinaIntl();
  const [numOfChildToCreate, setNumOfChildToCreate] = useState(1);
  const [baseName, setBaseName] = useState("");
  const [type, setType] = useState("Numerical");
  const [start, setStart] = useState(type === "Numerical" ? "1" : "A");
  const router = useRouter();

  const [_, setSplitChildSampleRunConfig] = useLocalStorage<
    MaterialSampleRunConfig | null | undefined
  >(SPLIT_CHILD_SAMPLE_RUN_CONFIG_KEY);

  const onCreatedChildSplitSampleChange = value => {
    setNumOfChildToCreate(value);
  };

  type SuffixOptions = "Numerical" | "Letter";

  const TYPE_OPTIONS: { label: string; value: SuffixOptions }[] = [
    {
      label: "Numerical",
      value: "Numerical"
    },
    {
      label: "Letter",
      value: "Letter"
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
          className="col-md-3"
          hideLabel={true}
          name={`sampleName[${index}]`}
          placeholder={
            sampleSrcName
              ? `${sampleSrcName}-${computedSuffix}`
              : `parentName-${computedSuffix}`
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
      const computedSuffix = computeSuffix({ index: i, start, type });
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
        baseName: configActionFields.baseName,
        start: configActionFields.start ?? start,
        type: configActionFields.type,
        destroyOriginal: configActionFields.destroyOriginal
      },
      configure_children: {
        sampleNames,
        sampleDescs
      }
    };

    // save the runConfig to local storage
    setSplitChildSampleRunConfig(runConfig);
    await router.push(`/collection/material-sample/workflows/split-run`);
  };

  const buttonBar = (
    <ButtonBar className="d-flex justify-content-center">
      <SubmitButton className="btn btn-info" hidePrimaryClass={true}>
        <DinaMessage id="next" />
      </SubmitButton>
    </ButtonBar>
  );

  const onChangeExternal = (value, formik) => {
    setType(value as any);
    // Make sure the placeholder is updated properly by simulating update the field value
    formik.values.start === null
      ? formik.setFieldValue("start", "")
      : formik.setFieldValue("start", null);
    isLetterType ? setStart("A") : setStart("1");
  };

  const isNumericalType = type === "Numerical";
  const isLetterType = type === "Letter";

  /** Form validation schema. */
  const runConfigFormSchema: SchemaOf<
    Pick<MaterialSampleRunConfigConfiguration, "baseName">
  > = object({
    baseName: string().required(
      formatMessage("field_materialSampleRunConfig_baseNameError")
    )
  });

  return (
    <div>
      <Head title={formatMessage("splitSubsampleTitle")} />
      <Nav />
      <main className="container-fluid">
        <h1>
          <DinaMessage id="splitSubsampleTitle" />
        </h1>
        <DinaForm
          initialValues={{ type: "Numerical" }}
          onSubmit={onSubmit}
          validationSchema={runConfigFormSchema}
        >
          {buttonBar}
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
                placeholder="ParentName"
                onChangeExternal={(_form, _name, value) =>
                  setBaseName(value as any)
                }
              />
              <SelectField
                className="col-md-2"
                name="type"
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

export const computeSuffix = ({ index, start, type }: ComputeSuffixProps) => {
  let computedSuffix;
  if (type === "Numerical") {
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
