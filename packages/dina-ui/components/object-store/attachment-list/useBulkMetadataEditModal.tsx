import { useModal } from "common-ui";
import { DinaMessage } from "../../../intl/dina-ui-intl";
import { BulkMetadataEditor } from "../metadata-bulk-editor/BulkMetadataEditor";

export interface BulkMetadataEditModalParams {
  afterMetadatasSaved?: (metadataIds: string[]) => void | Promise<void>;
  objectUploadIds?: string[];
  metadataIds?: string[];
  group?: string;
}

/** Opens the bulk Metadata editor spreadsheet UI in a modal. */
export function useBulkMetadataEditModal() {
  const { openModal, closeModal } = useModal();

  function openMetadataEditorModal({
    afterMetadatasSaved: afterMetadatasSavedProp,
    objectUploadIds,
    metadataIds,
    group
  }: BulkMetadataEditModalParams) {
    async function afterMetadatasSavedInternal(ids: string[]) {
      await afterMetadatasSavedProp?.(ids);
      closeModal();
    }

    openModal(
      <div className="modal-content modal-UseBulkMetadataEdit">
        <div className="modal-header">
          <button className="btn btn-dark" onClick={closeModal}>
            <DinaMessage id="cancelButtonText" />
          </button>
        </div>
        <div className="modal-body">
          <BulkMetadataEditor
            objectUploadIds={objectUploadIds}
            metadataIds={metadataIds}
            group={group}
            afterMetadatasSaved={afterMetadatasSavedInternal}
          />
        </div>
      </div>
    );
  }

  return { openMetadataEditorModal };
}
