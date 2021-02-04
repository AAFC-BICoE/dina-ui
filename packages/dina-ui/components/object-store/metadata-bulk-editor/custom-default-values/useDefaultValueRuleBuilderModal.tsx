import { useModal } from "common-ui";
import { DinaMessage } from "../../../../intl/dina-ui-intl";
import { DefaultValueRuleEditor } from "./DefaultValueRuleEditor";

export function useDefaultValueRuleEditorModal() {
  const { closeModal, openModal } = useModal();

  function openDefaultValuesModal() {
    openModal(
      <div className="modal-content">
        <style>{`
          .modal-dialog {
            max-width: 70rem !important;
          }
          .modal-content {
            max-height: calc(100vh - 3rem) !important;
            overflow-y: scroll !important;
          }
        `}</style>
        <div className="modal-header">
          <h2>Default value rules</h2>
        </div>
        <div className="modal-body">
          <DefaultValueRuleEditor onSave={closeModal} />
        </div>
        <div className="modal-footer">
          <button className="btn btn-dark" onClick={closeModal}>
            <DinaMessage id="closeButtonText" />
          </button>
        </div>
      </div>
    );
  }

  return { openDefaultValuesModal };
}
