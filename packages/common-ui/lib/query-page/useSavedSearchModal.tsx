import { useModal } from "common-ui";
import { useDinaIntl } from "packages/dina-ui/intl/dina-ui-intl";
import { JsonValue } from "type-fest";

interface SavedSearchModalParams {
  value: JsonValue;
  saveSearch: (value: JsonValue, isDefault?: boolean) => void;
}

export function useSavedSearchModal() {
  const { closeModal, openModal } = useModal();
  const { formatMessage } = useDinaIntl();

  function openSavedSearchModal({ value, saveSearch }: SavedSearchModalParams) {
    openModal(
      <div className="modal-content">
        <style>{`
          .modal-dialog {
            max-width: 70rem !important;
          }
        `}</style>
        <main className="modal-body">
          <div className="d-flex align-items-center flex-column gap-2">
            <h1 style={{ border: "none" }}>{formatMessage("saveSearch")}</h1>
            <span>{formatMessage("saveSearchInstruction")}</span>
            <input className="form-control" />
            <div className="d-flex gap-2">
              <button className="btn btn-secondary" onClick={closeModal}>
                {formatMessage("cancelButtonText")}
              </button>
              <button
                className="btn btn-primary"
                onClick={() => saveSearch(value as any, false)}
              >
                {formatMessage("save")}
              </button>
              <button
                className="btn btn-primary"
                onClick={() => saveSearch(value as any, true)}
              >
                {formatMessage("saveAsDefault")}
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return { openSavedSearchModal };
}
