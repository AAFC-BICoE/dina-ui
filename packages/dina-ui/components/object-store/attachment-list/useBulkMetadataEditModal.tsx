import { useModal } from "common-ui";
import { DinaMessage } from "../../../intl/dina-ui-intl";
import { ExistingMetadataBulkEditor } from "../../bulk-metadata/ExistingMetadataBulkEditor";
import { UploadingMetadataBulkEditor } from "../../bulk-metadata/UploadingMetadataBulkEditor";
import { FaSave, FaTimes } from "react-icons/fa";
import { useRef } from "react";
import { MetadataBulkEditorHandle } from "../../bulk-metadata/MetadataBulkEditor";

export interface BulkMetadataEditModalParams {
  afterMetadatasSaved?: (metadataIds: string[]) => void | Promise<void>;
  objectUploadIds?: string[];
  metadataIds?: string[];
  group?: string;
}

interface BulkMetadataEditModalContentProps {
  params: BulkMetadataEditModalParams;
  closeModal: () => void;
}

function BulkMetadataEditModalContent({
  params,
  closeModal
}: BulkMetadataEditModalContentProps) {
  const {
    afterMetadatasSaved: afterMetadatasSavedProp,
    objectUploadIds,
    metadataIds,
    group
  } = params;

  const editorRef = useRef<MetadataBulkEditorHandle>(null);

  async function afterMetadatasSavedInternal(ids: string[]) {
    await afterMetadatasSavedProp?.(ids);
    closeModal();
  }

  return (
    <div className="modal-content">
      <style>{`
        .modal-dialog {
          max-width: calc(90vw - 3rem);
        }
        .ht_master .wtHolder {
          height: 0% !important;
        }
      `}</style>
      <div className="modal-header">
        <div className="ms-auto d-flex gap-2">
          <button className="btn btn-dark" onClick={closeModal}>
            <FaTimes className="me-2" />
            <DinaMessage id="cancelButtonText" />
          </button>
          <button
            className="btn btn-primary"
            onClick={() => editorRef.current?.saveAll()}
          >
            <FaSave className="me-2" />
            <DinaMessage id="saveAll" />
          </button>
        </div>
      </div>
      <div className="modal-body">
        {metadataIds ? (
          <ExistingMetadataBulkEditor
            ref={editorRef}
            ids={metadataIds}
            onSaved={afterMetadatasSavedInternal}
            insideModal={true}
          />
        ) : (
          objectUploadIds && (
            <UploadingMetadataBulkEditor
              ref={editorRef}
              objectUploadIds={objectUploadIds}
              onSaved={afterMetadatasSavedInternal}
              inputGroup={group}
              insideModal={true}
            />
          )
        )}
      </div>
    </div>
  );
}

/** Opens the bulk Metadata editor spreadsheet UI in a modal. */
export function useBulkMetadataEditModal() {
  const { openModal, closeModal } = useModal();

  function openMetadataEditorModal(params: BulkMetadataEditModalParams) {
    openModal(
      <BulkMetadataEditModalContent params={params} closeModal={closeModal} />
    );
  }

  return { openMetadataEditorModal };
}
