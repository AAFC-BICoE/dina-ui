import { ReactNode } from "react";
import { DinaForm, DinaFormSubmitParams } from "../formik-connected/DinaForm";
import { FormikButton } from "../formik-connected/FormikButton";
import { OnFormikSubmit } from "../formik-connected/safeSubmit";
import { SubmitButton } from "../formik-connected/SubmitButton";
import { CommonMessage } from "../intl/common-ui-intl";
import { useModal } from "./modal";
import { pick } from "lodash";

export interface AreYouSureModalProps {
  /** Describes the acion you're asking the user about. */
  actionMessage: ReactNode;

  onYesButtonClicked: OnFormikSubmit;

  /** Describes the message displaying to the user in order to make action decision. */
  messageBody?: ReactNode;
}

export function AreYouSureModal({
  actionMessage,
  messageBody,
  onYesButtonClicked
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
            <div className="message-body">
              {messageBody ?? (
                <p style={{ fontSize: "x-large" }}>
                  <CommonMessage id="areYouSure" />
                </p>
              )}
            </div>
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
                onClick={closeModal}
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
