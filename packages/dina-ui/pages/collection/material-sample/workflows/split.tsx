import {
  CheckBoxWithoutWrapper,
  DinaForm,
  FieldSet,
  NumberField,
  SelectField,
  TextField
} from "common-ui";
import NumberSpinnerField from "packages/common-ui/lib/formik-connected/NumberSpinnerField";
import { Head, Nav } from "packages/dina-ui/components";
import React, { useState } from "react";
import { DinaMessage, useDinaIntl } from "../../../../intl/dina-ui-intl";

interface SplitChildRowprops {
  index: number;
  baseName: string;
}

export default function ConfigAction() {
  const { formatMessage } = useDinaIntl();
  const [numOfChildToCreate, setNumOfChildToCreate] = useState(1);
  const [baseName, setBaseName] = useState("");
  const [type, setType] = useState("Numerical");
  const [start, setStart] = useState(type === "Numerical" ? "1" : "A");

  const onCreatedChildSplitSampleChange = e => {
    setNumOfChildToCreate(e.target.value);
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
      <span className="col-md-3">{formatMessage("name")}</span>
      <span className="col-md-3">{formatMessage("description")}</span>
    </div>
  );

  const SplitChildRow = ({
    index,
    baseName: sampleSrcName
  }: SplitChildRowprops) => (
    <div className="d-flex">
      <span className="col-md-1">
        {type === "Numerical"
          ? isNaN(parseInt(start, 10))
            ? index - 1
            : index - parseInt(start, 10) + 1
          : index}
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
    const accumulate: any = [];
    for (let i = 0; i < numOfChildToCreate; i++) {
      type === "Numerical"
        ? accumulate.push(
            <SplitChildRow
              key={i}
              index={i + parseInt(start, 10)}
              baseName={baseName}
            />
          )
        : accumulate.push(
            <SplitChildRow key={i} index={i + 1} baseName={baseName} />
          );
    }
    return accumulate;
  };

  return (
    <div>
      <Head title={formatMessage("splitSubsampleTitle")} />
      <Nav />
      <main className="container-fluid">
        <h1>
          <DinaMessage id="splitSubsampleTitle" />
        </h1>
        <p>
          <span className="fw-bold">{formatMessage("description")}:</span>
          {formatMessage("splitSampleDescription")}
        </p>
        <DinaForm initialValues={{ type: "Numerical" }}>
          <>
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
                  onChangeExternal={(_, _name, value) =>
                    setBaseName(value as any)
                  }
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
                    onChangeExternal={(_, _name, value) =>
                      setStart(value as any)
                    }
                  />
                ) : (
                  <TextField
                    className="col-md-2"
                    name="start"
                    placeholder="A"
                  />
                )}
              </div>
              <div>
                <SplitChildHeader />
                <SplitChildRows />
              </div>
            </FieldSet>
          </>
        </DinaForm>
      </main>
    </div>
  );
}
