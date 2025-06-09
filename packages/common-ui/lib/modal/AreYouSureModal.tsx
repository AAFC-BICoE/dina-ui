import { ReactNode } from "react";
import { DinaForm, DinaFormSubmitParams } from "../formik-connected/DinaForm";
import { FormikButton } from "../formik-connected/FormikButton";
import { OnFormikSubmit } from "../formik-connected/safeSubmit";
import { SubmitButton } from "../formik-connected/SubmitButton";
import { CommonMessage } from "../intl/common-ui-intl";
import { useModal } from "./modal";
import _ from "lodash";

export interface AreYouSureModalProps {
  /** Describes the acion you're asking the user about. */
  actionMessage: ReactNode;

  onYesButtonClicked: OnFormikSubmit;

  /** Describes the message displaying to the user in order to make action decision. */
  messageBody?: ReactNode;

  /**
   * Replace the "Yes" button with a custom element
   */
  yesButtonText?: ReactNode;

  /**
   * Replace the "No" button with a custom element.
   */
  noButtonText?: ReactNode;
}

export function AreYouSureModal({
  actionMessage,
  messageBody,
  onYesButtonClicked,
  yesButtonText,
  noButtonText
}: AreYouSureModalProps) {
  const { closeModal } = useModal();

  async function onYesClickInternal(
    dinaFormSubmitParams: DinaFormSubmitParams<any>
  ) {
    const yesBtnParam = _.pick(
      dinaFormSubmitParams,
      "submittedValues",
      "formik"
    );
    await onYesButtonClicked(yesBtnParam.submittedValues, yesBtnParam.formik);
    closeModal();
  }

  return (
    <DinaForm initialValues={{}} onSubmit={onYesClickInternal}>
      <div className="modal-content are-you-sure-modal">
        <div className="modal-header">
          <div className="modal-title h3">{actionMessage}</div>
        </div>
        <div className="modal-body">
          <main>
            <div className="message-body text-center">
              <p>{messageBody ?? <CommonMessage id="areYouSure" />}</p>
            </div>
          </main>
        </div>
        <div className="modal-footer" style={{ justifyContent: "center" }}>
          <div className="d-flex gap-3">
            <FormikButton
              className="btn btn-dark no-button"
              onClick={closeModal}
              buttonProps={() => ({ style: { width: "10rem" } })}
            >
              {noButtonText ?? <CommonMessage id="no" />}
            </FormikButton>

            <SubmitButton className="yes-button">
              {yesButtonText ?? <CommonMessage id="yes" />}
            </SubmitButton>
          </div>
        </div>
      </div>
    </DinaForm>
  );
}
