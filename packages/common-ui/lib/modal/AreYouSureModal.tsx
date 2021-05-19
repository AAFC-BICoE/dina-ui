import { ReactNode } from "react";
import { DinaForm } from "../formik-connected/DinaForm";
import { FormikButton } from "../formik-connected/FormikButton";
import { SubmitButton } from "../formik-connected/SubmitButton";
import { CommonMessage } from "../intl/common-ui-intl";
import { useModal } from "./modal";

export interface AreYouSureModalProps {
  /** Describes the acion you're asking the user about. */
  actionMessage: ReactNode;

  onYesButtonClicked: () => void | Promise<void>;

  /** Describes the message displaying to the user in order to make action decision. */
  messageBody?: ReactNode;
}

export function AreYouSureModal({
  actionMessage,
  messageBody,
  onYesButtonClicked
}: AreYouSureModalProps) {
  const { closeModal } = useModal();

  async function onYesClickInternal() {
    await onYesButtonClicked();
    closeModal();
  }

  return (
    <div className="modal-content">
      <div className="modal-header">
        <h2>{actionMessage}</h2>
      </div>
      <div className="modal-body">
        {messageBody ? (
          <>{messageBody}</>
        ) : (
          <p>
            <CommonMessage id="areYouSure" />
          </p>
        )}
        <DinaForm initialValues={{}} onSubmit={onYesClickInternal}>
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
