import { DinaForm } from "packages/common-ui/lib";
import { ButtonBar } from "packages/common-ui/lib/button-bar/ButtonBar";
import { FormikButton } from "packages/common-ui/lib/formik-connected/FormikButton";

import { DinaMessage, useDinaIntl } from "packages/dina-ui/intl/dina-ui-intl";
import React, { useState } from "react";

export default function SplitRunAction(props) {
  const { nextStep, previousStep, currentStep } = props;
  const { formatMessage } = useDinaIntl();

  const onSubmit = async formik => {
    // submit to back end or save to local
    // navigate to a run aciton page
    nextStep(formik.values);
  };

  const onBack = async formik => {
    // submit to back end or save to local
    // navigate to a run aciton page
    previousStep(formik.values);
  };

  const buttonBar = (
    <ButtonBar className="justify-content-center">
      <FormikButton className="btn btn-secondary" onClick={onBack}>
        <DinaMessage id="backLabel" />
      </FormikButton>

      <FormikButton className="btn btn-info" onClick={onSubmit}>
        <DinaMessage id="next" />
      </FormikButton>
    </ButtonBar>
  );
  return (
    <div>
      <DinaForm initialValues={{}}>
        <p>
          <span className="fw-bold">{formatMessage("description")}:</span>
          {formatMessage("splitSampleDescription")}
        </p>

        {buttonBar}
      </DinaForm>
    </div>
  );
}
