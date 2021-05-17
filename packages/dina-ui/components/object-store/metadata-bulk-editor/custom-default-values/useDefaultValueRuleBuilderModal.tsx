import { useModal } from "common-ui";
import { DinaMessage } from "../../../../intl/dina-ui-intl";
import { DefaultValueRuleEditor } from "./DefaultValueRuleEditor";

interface DefaultValueRuleEditorModalParams {
  index: number | null;
  onSave: (index: number | null) => void;
}

export function useDefaultValueRuleEditorModal() {
  const { closeModal, openModal } = useModal();

  function openDefaultValuesModal({
    index,
    onSave
  }: DefaultValueRuleEditorModalParams) {
    openModal(
      <div className="modal-content">
        <style>{`
          .modal-dialog {
            max-width: 70rem !important;
          }
        `}</style>
        <div className="modal-header">
          <h2>
            <DinaMessage id="defaultValuesConfigs" />
          </h2>
        </div>
        <div className="modal-body">
          <DefaultValueRuleEditor
            initialIndex={index}
            onSave={newIndex => {
              closeModal();
              onSave(newIndex);
            }}
          />
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
