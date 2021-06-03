import { DinaForm, FieldSet, TextField } from "common-ui";
import NumberSpinnerField from "packages/common-ui/lib/formik-connected/NumberSpinnerField";
import { Head, Nav } from "packages/dina-ui/components";
import React from "react";
import { DinaMessage, useDinaIntl } from "../../../../intl/dina-ui-intl";

export default function ConfigAction() {
  const { formatMessage } = useDinaIntl();

  const onCreatedChildSplitSampleChange = () => {
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
              <NumberSpinnerField
                name="createdChilderenNum"
                className="col-md-2"
                onChange={onCreatedChildSplitSampleChange}
                label={formatMessage("splitSampleChildSamplesToCreateLabel")}
              />
            </FieldSet>
          </>
        </DinaForm>
      </main>
    </div>
  );
}
