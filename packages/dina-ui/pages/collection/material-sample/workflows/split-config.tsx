import {
  ButtonBar,
  CheckBoxWithoutWrapper,
  DinaForm,
  FieldSet,
  FormikButton,
  NumberField,
  SelectField,
  TextField
} from "common-ui";
import NumberSpinnerField from "packages/common-ui/lib/formik-connected/NumberSpinnerField";
import React, { useState } from "react";
import { DinaMessage, useDinaIntl } from "../../../../intl/dina-ui-intl";

interface SplitChildRowProps {
  index: number;
  baseName: string;
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
    } // ,
    // {
    //   label: "Letter",
    //   value: "Letter"
    // }
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
    baseName: sampleSrcName
  }: SplitChildRowProps) => (
    <div className="d-flex">
      <span className="col-md-1 fw-bold">
        #
        {type === "Numerical"
          ? isNaN(parseInt(start, 10))
            ? index - 1
            : index - parseInt(start, 10) + 1
          : index}
        :
      </span>
      <TextField
        className="col-md-3"
        hideLabel={true}
        name={`"sampleName"${index}`}
        placeholder={
          sampleSrcName ? `${sampleSrcName}-${index}` : `parentName-${index}`
        }
      />
      <TextField
        className="col-md-3"
        hideLabel={true}
        name={`"description${index}`}
      />
    </div>
  );

  const SplitChildRows = () => {
    const childRows: any = [];
    for (let i = 0; i < numOfChildToCreate; i++) {
      type === "Numerical"
        ? childRows.push(
            <SplitChildRow
              key={i}
              index={i + parseInt(start, 10)}
              baseName={baseName}
            />
          )
        : childRows.push(
            <SplitChildRow key={i} index={i + 1} baseName={baseName} />
          );
    }
    return childRows;
  };

  const onSubmit = async ({}) => {
    // submit to back end or save to local
    // navigate to a run aciton page
    nextStep();
  };

  const buttonBar = (
    <ButtonBar>
      <FormikButton
        className="btn btn-dark"
        onClick={(_, formik) => onSubmit(formik)}
      >
        <DinaMessage id="next" />
      </FormikButton>
    </ButtonBar>
  );

  return (
    <div>
      <p>
        <span className="fw-bold">{formatMessage("description")}:</span>
        {formatMessage("splitSampleDescription")}
      </p>
      <DinaForm initialValues={{ type: "Numerical" }}>
        {buttonBar}
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
              onChange={(value, _) => setType(value as any)}
            />
            {type === "Numerical" ? (
              <NumberField
                className="col-md-2"
                name="start"
                onChangeExternal={(_, _name, value) => setStart(value as any)}
              />
            ) : (
              <TextField className="col-md-2" name="start" placeholder="A" />
            )}
          </div>
          <div>
            <SplitChildHeader />
            <SplitChildRows />
          </div>
        </FieldSet>
        {buttonBar}
      </DinaForm>
    </div>
  );
}
