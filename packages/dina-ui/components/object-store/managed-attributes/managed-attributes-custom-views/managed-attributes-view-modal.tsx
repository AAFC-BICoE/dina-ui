import { useModal, withResponse } from "common-ui";
import { PersistedResource } from "kitsu";
import {
  ManagedAttributesViewFormProps,
  useManagedAttributesView
} from "../../../../pages/collection/managed-attributes-view/edit";
import { DinaMessage } from "../../../../intl/dina-ui-intl";
import { CustomView } from "../../../../types/collection-api";
import { ManagedAttributesViewForm } from "./ManagedAttributesViewForm";

export function useManagedAttributesViewEditModal(
  /** Default component to use in the modal form. */
  defaultManagedAttributeComponent?: string
) {
  const { closeModal, openModal } = useModal();

  function openManagedAttributesViewEditModal(
    id: string | null,
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
          <EditManagedAttributesView
            id={id}
            onSaved={finishModal}
            defaultManagedAttributeComponent={defaultManagedAttributeComponent}
          />
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
  onSaved,
  defaultManagedAttributeComponent
}: {
  id: string | null;
  onSaved: (customView: PersistedResource<CustomView>) => Promise<void>;
  defaultManagedAttributeComponent?: string;
}) {
  const query = useManagedAttributesView(id ?? undefined);

  const formProps: ManagedAttributesViewFormProps = {
    onSaved,
    // Don't allow changing the component inside the modal.
    // This should probably not be changed at all after creation.
    disabledAttributeComponent: true
  };

  return id ? (
    withResponse(query, ({ data }) => (
      <ManagedAttributesViewForm {...formProps} data={data} />
    ))
  ) : (
    <ManagedAttributesViewForm
      {...formProps}
      defaultManagedAttributeComponent={defaultManagedAttributeComponent}
    />
  );
}
