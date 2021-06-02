import { DinaForm, FieldSet, TextField } from "common-ui";
import NumberSpinner from "packages/common-ui/lib/number-spinner/NumberSpinner";
import { Head, Nav } from "packages/dina-ui/components";
import React from "react";
import { DinaMessage, useDinaIntl } from "../../../../intl/dina-ui-intl";

export default function ConfigAction() {
  const { formatMessage } = useDinaIntl();

  const onCreatedChildSplitSampleChange = e => {
    //    console.log("e is " + e.target.value);
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
        <DinaForm initialValues={{}}>
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
                {formatMessage("splitSampleChildSamplesToCreateLabel")}:
              </span>
              <div className="col-md-1">
                <NumberSpinner
                  onChange={onCreatedChildSplitSampleChange}
                  size={1}
                />
              </div>
            </FieldSet>
          </>
        </DinaForm>
      </main>
    </div>
  );
}
