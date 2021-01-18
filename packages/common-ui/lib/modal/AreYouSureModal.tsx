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
}

export function AreYouSureModal({
  actionMessage,
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
        <p>
          <CommonMessage id="areYouSure" />
        </p>
      </div>
      <div className="modal-footer">
        <DinaForm initialValues={{}} onSubmit={onYesClickInternal}>
          <SubmitButton className="btn btn-primary yes-button">
            <CommonMessage id="yes" />
          </SubmitButton>
          <FormikButton className="btn btn-dark no-button" onClick={closeModal}>
            <CommonMessage id="no" />
          </FormikButton>
        </DinaForm>
      </div>
    </div>
  );
}
