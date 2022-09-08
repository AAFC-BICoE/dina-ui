import { useModal } from "common-ui";
import { DinaMessage } from "../../../intl/dina-ui-intl";
import { ExistingMetadataBulkEditor } from "../../bulk-metadata/ExistingMetadataBulkEditor";
import { UploadingMetadataBulkEditor } from "../../bulk-metadata/UploadingMetadataBulkEditor";
import { useRouter } from "next/router";

export interface BulkMetadataEditModalParams {
  afterMetadatasSaved?: (metadataIds: string[]) => void | Promise<void>;
  objectUploadIds?: string[];
  metadataIds?: string[];
  group?: string;
}

/** Opens the bulk Metadata editor spreadsheet UI in a modal. */
export function useBulkMetadataEditModal() {
  const { openModal, closeModal } = useModal();
  const router = useRouter();

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
      <div className="modal-content">
        <style>{`
          .modal-dialog {
            max-width: calc(100vw - 3rem);
          }
          .ht_master .wtHolder {
            height: 0% !important;
          }
        `}</style>
        <div className="modal-header">
          <button className="btn btn-dark" onClick={closeModal}>
            <DinaMessage id="cancelButtonText" />
          </button>
        </div>
        <div className="modal-body">
          {metadataIds ? (
            <ExistingMetadataBulkEditor
              ids={metadataIds}
              onSaved={afterMetadatasSavedInternal}
            />
          ) : (
            objectUploadIds && (
              <UploadingMetadataBulkEditor
                objectUploadIds={objectUploadIds}
                onSaved={afterMetadatasSavedInternal}
                inputGroup={group}
              />
            )
          )}
        </div>
      </div>
    );
  }

  return { openMetadataEditorModal };
}
