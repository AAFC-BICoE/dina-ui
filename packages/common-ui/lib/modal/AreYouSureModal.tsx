import React, { ReactNode, useState } from "react";
import { DinaForm, DinaFormSubmitParams } from "../formik-connected/DinaForm";
import { FormikButton } from "../formik-connected/FormikButton";
import { OnFormikSubmit } from "../formik-connected/safeSubmit";
import { SubmitButton } from "../formik-connected/SubmitButton";
import { CommonMessage } from "../intl/common-ui-intl";
import { useModal } from "./modal";
import { isNumber, pick } from "lodash";
import { FormattedMessage } from "react-intl";
import { millisToMinutesAndSeconds } from "../account/UserSessionTimeout";
import { useDinaIntl } from "../../../dina-ui/intl/dina-ui-intl";

export interface AreYouSureModalProps {
  /** Describes the acion you're asking the user about. */
  actionMessage: ReactNode;

  onYesButtonClicked: OnFormikSubmit;

  /** Describes the message displaying to the user in order to make action decision. */
  messageBody?: ReactNode;

  onNoButtonClicked?: () => void;
}

export function AreYouSureModal({
  actionMessage,
  messageBody,
  onYesButtonClicked,
  onNoButtonClicked
}: AreYouSureModalProps) {
  const { closeModal } = useModal();

  async function onYesClickInternal(
    dinaFormSubmitParams: DinaFormSubmitParams<any>
  ) {
    const yesBtnParam = pick(dinaFormSubmitParams, "submittedValues", "formik");
    await onYesButtonClicked(yesBtnParam.submittedValues, yesBtnParam.formik);
    closeModal();
  }

  return (
    <div className="modal-content">
      <div className="modal-header">
        <h1 style={{ border: "none" }}>{actionMessage}</h1>
      </div>
      <div className="modal-body">
        <DinaForm initialValues={{}} onSubmit={onYesClickInternal}>
          <main>
            {messageBody ?? (
              <p style={{ fontSize: "x-large" }}>
                <CommonMessage id="areYouSure" />
              </p>
            )}
          </main>
          <div className="row">
            <div className="col-md-3">
              <SubmitButton className="form-control yes-button">
                <CommonMessage id="yes" />
              </SubmitButton>
            </div>
            <div className="offset-md-6 col-md-3">
              <FormikButton
                className="btn btn-dark form-control no-button"
                onClick={() => (onNoButtonClicked?.(), closeModal())}
              >
                <CommonMessage id="no" />
              </FormikButton>
            </div>
          </div>
        </DinaForm>
      </div>
    </div>
  );
}
