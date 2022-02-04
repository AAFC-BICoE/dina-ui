import { useModal, withResponse } from "common-ui";
import { PersistedResource } from "kitsu";
import {
  ManagedAttributesViewForm,
  useManagedAttributesView
} from "../../../pages/collection/managed-attributes-view/edit";
import { DinaMessage } from "../../../intl/dina-ui-intl";
import { CustomView } from "../../../types/collection-api";

export function useManagedAttributesViewEditModal() {
  const { closeModal, openModal } = useModal();

  function openManagedAttributesViewEditModal(
    id: string,
    onSaved: (customView: PersistedResource<CustomView>) => void
  ) {
    async function finishModal(customView: PersistedResource<CustomView>) {
      closeModal();
      onSaved(customView);
    }

    openModal(
      <div className="modal-content">
        <style>{`.modal-dialog { max-width: 100rem; }`}</style>
        <div className="modal-header">
          <h2>
            <DinaMessage id="editManagedAttributesViewTitle" />
          </h2>
        </div>
        <div className="modal-body">
          <EditManagedAttributesView id={id} onSaved={finishModal} />
        </div>
        <div className="modal-footer">
          <button className="btn btn-dark" onClick={() => closeModal()}>
            <DinaMessage id="cancelButtonText" />
          </button>
        </div>
      </div>
    );
  }

  return { openManagedAttributesViewEditModal };
}

function EditManagedAttributesView({
  id,
  onSaved
}: {
  id: string;
  onSaved: (customView: PersistedResource<CustomView>) => Promise<void>;
}) {
  const query = useManagedAttributesView(id);

  return withResponse(query, ({ data }) => (
    <ManagedAttributesViewForm fetchedView={data} onSaved={onSaved} />
  ));
}
