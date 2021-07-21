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
        <h2>{actionMessage}</h2>
      </div>
      <div className="modal-body">
        <DinaForm initialValues={{}} onSubmit={onYesClickInternal}>
          <p>{messageBody ?? <CommonMessage id="areYouSure" />}</p>
          <div className="list-inline">
            <div className="list-inline-item" style={{ width: "8rem" }}>
              <SubmitButton className="btn btn-primary form-control yes-button">
                <CommonMessage id="yes" />
              </SubmitButton>
            </div>
            <div className="list-inline-item" style={{ width: "8rem" }}>
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
