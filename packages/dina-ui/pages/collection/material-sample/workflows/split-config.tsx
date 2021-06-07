import {
  ButtonBar,
  CheckBoxWithoutWrapper,
  DinaForm,
  FieldSet,
  FormikButton,
  SelectField,
  TextField
} from "common-ui";
import NumberSpinnerField from "packages/common-ui/lib/formik-connected/NumberSpinnerField";
import React, { useState } from "react";
import { DinaMessage, useDinaIntl } from "../../../../intl/dina-ui-intl";

interface SplitChildRowProps {
  index: number;
  baseName: string;
  computedSuffix: string;
}

export default function ConfigAction(props) {
  const { nextStep } = props;
  const { formatMessage } = useDinaIntl();
  const [numOfChildToCreate, setNumOfChildToCreate] = useState(1);
  const [baseName, setBaseName] = useState("");
  const [type, setType] = useState("Numerical");
  const [start, setStart] = useState(type === "Numerical" ? "1" : "A");

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
        <span className="col-md-1 fw-bold">#{index}:</span>
        <TextField
          className="col-md-3"
          hideLabel={true}
          name={`sampleName${index}`}
          placeholder={
            sampleSrcName
              ? `${sampleSrcName}-${computedSuffix}`
              : `parentName-${computedSuffix}`
          }
        />
        <TextField
          className="col-md-3"
          hideLabel={true}
          name={`"description${index}`}
        />
      </div>
    );
  };

  const SplitChildRows = () => {
    const childRows: any = [];
    for (let i = 0; i < numOfChildToCreate; i++) {
      if (type === "Numerical") {
        // correclty set the start when numerical input is null/empty, default to 1
        const computedSuffix = isNaN(parseInt(start, 10))
          ? i + 1
          : i + parseInt(start, 10);
        childRows.push(
          <SplitChildRow
            key={i}
            index={i + 1}
            computedSuffix={computedSuffix.toString()}
            baseName={baseName}
          />
        );
      } else {
        let myStart = start;
        let computedSuffix;
        // Correclty set the start value when letter input is null/empty, defualt to "A"
        if (!myStart || myStart.length === 0 || !isNaN(parseInt(myStart, 10))) {
          myStart = "A";
        }
        const charCode = myStart.charCodeAt(0) + i;
        // Only if the char is a letter, split child row will be added
        if (
          (charCode >= 97 && charCode <= 122) ||
          (charCode >= 65 && charCode <= 90)
        ) {
          computedSuffix = String.fromCharCode(charCode);
          childRows.push(
            <SplitChildRow
              key={i}
              index={i + 1}
              baseName={baseName}
              computedSuffix={computedSuffix}
            />
          );
        }
      }
    }
    return childRows;
  };

  const onSubmit = async formik => {
    // submit to back end or save to local
    // navigate to a run aciton page
    nextStep(formik.values);
  };

  const buttonBar = (
    <ButtonBar className="d-flex justify-content-center">
      <FormikButton
        className="btn btn-info "
        onClick={(_, formik) => onSubmit(formik)}
      >
        <DinaMessage id="next" />
      </FormikButton>
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

  return (
    <div>
      <DinaForm initialValues={{ type: "Numerical" }}>
        <p>
          <span className="fw-bold">{formatMessage("description")}:</span>
          {formatMessage("splitSampleDescription")}
        </p>
        <FieldSet legend={<DinaMessage id="splitSampleActionMetadataLegend" />}>
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
              name="createdChilderenNum"
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
              onChangeExternal={(_, _name, value) => setBaseName(value as any)}
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
              onChangeExternal={(_, _name, value) => {
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
    </div>
  );
}
