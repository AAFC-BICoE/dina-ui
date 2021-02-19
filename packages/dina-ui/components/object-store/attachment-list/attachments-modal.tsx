import { FieldHeader, useApiClient, useModal } from "common-ui";
import { uniqBy } from "lodash";
import { useState } from "react";
import { DinaMessage } from "../../../intl/dina-ui-intl";
import { Metadata } from "../../../types/objectstore-api";
import { AttachmentSection } from "./AttachmentSection";
import ReactTable from "react-table";

export function useAttachmentsModal() {
  const { closeModal, openModal } = useModal();
  const [attachedMetadatas, setAttachedMetadatas] = useState<Metadata[]>([]);
  const { bulkGet } = useApiClient();

  async function addAttachedMetadatas(metadataIds: string[]) {
    const metadatas = await bulkGet<Metadata>(
      metadataIds.map(mId => `/metadata/${mId}`),
      { apiBaseUrl: "/objectstore-api" }
    );

    // Add the selected Metadatas to the array, making sure there are no duplicates:
    setAttachedMetadatas(current =>
      uniqBy([...current, ...metadatas], metadata => metadata.id)
    );

    closeModal();
  }

  function removeMetadata(id: string) {
    // Remove the selected Metadata from the array:
    setAttachedMetadatas(current =>
      current.filter(metadata => metadata.id !== id)
    );
  }

  function openAttachmentsModal() {
    openModal(
      <div className="modal-content">
        <style>{`
        .modal-dialog {
          max-width: calc(100vw - 3rem);
        }
        .modal-content {
          max-height: calc(100vh - 3rem) !important;
          overflow-y: scroll !important;
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
          <AttachmentSection afterMetadatasSaved={addAttachedMetadatas} />
        </div>
      </div>
    );
  }

  const attachedMetadatasView = (
    <div>
      <h2>Attachments ({attachedMetadatas.length})</h2>
      {attachedMetadatas.length ? (
        <ReactTable
          columns={[
            ...[
              "originalFilename",
              "acCaption",
              "xmpMetadataDate",
              "acTags"
            ].map(accessor => ({
              accessor,
              Header: <FieldHeader name={accessor} />
            })),
            {
              Cell: ({ original: { id } }) => (
                <button onClick={() => removeMetadata(id)} type="button">
                  <DinaMessage id="remove" />
                </button>
              )
            }
          ]}
          data={attachedMetadatas}
          minRows={attachedMetadatas.length}
          showPagination={false}
        />
      ) : null}
      <button
        className="btn btn-primary"
        type="button"
        onClick={openAttachmentsModal}
      >
        <DinaMessage id="addAttachments" />
      </button>
    </div>
  );

  return { attachedMetadatas, attachedMetadatasUI };
}
