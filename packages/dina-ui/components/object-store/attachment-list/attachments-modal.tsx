import {
  CheckBoxWithoutWrapper,
  FieldHeader,
  FieldSet,
  useApiClient,
  useModal,
  useQuery
} from "common-ui";
import { uniqBy, isArray } from "lodash";
import { PersistedResource } from "kitsu";
import { useEffect, useState } from "react";
import ReactTable from "react-table";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { Metadata } from "../../../types/objectstore-api";
import { AllowAttachmentsConfig, AttachmentSection } from "./AttachmentSection";

export interface AttachmentsModalParams {
  /** Pre-existing metadata attachments. */
  initialMetadatas?: PersistedResource<Metadata>[];

  /** Dependencies for re-initializing the attachment list. */
  deps: any[];

  title?: JSX.Element;

  isTemplate?: boolean;

  /** Manually set whether new/existing attachments can be added. */
  allowAttachmentsConfig?: AllowAttachmentsConfig;

  allowNewFieldName?: string;
  allowExistingFieldName?: string;
  /** fieldset id */
  id?: string;
  index?: string;
}

export function useAttachmentsModal({
  initialMetadatas = [],
  deps,
  title,
  isTemplate,
  allowNewFieldName,
  allowExistingFieldName,
  id,
  index,
  allowAttachmentsConfig = { allowExisting: true, allowNew: true }
}: AttachmentsModalParams) {
  const { closeModal, openModal } = useModal();
  const { bulkGet } = useApiClient();

  const initSelectedMetadatas = !!index
    ? new Map().set(index, initialMetadatas)
    : initialMetadatas;

  const [selectedMetadatas, setSelectedMetadatas] = useState<any>(
    initSelectedMetadatas
  );
  useEffect(() => {
    setSelectedMetadatas(initSelectedMetadatas);
  }, deps);

  // Just check if the object-store is up:
  const { error } = useQuery<[]>({ path: "objectstore-api/metadata" });

  const { formatMessage } = useDinaIntl();

  async function addAttachedMetadatas(metadataIds: string[]) {
    const metadatas = await bulkGet<Metadata>(
      metadataIds.map(mId => `/metadata/${mId}`),
      { apiBaseUrl: "/objectstore-api" }
    );

    // Add the selected Metadatas to the array, making sure there are no duplicates:
    setSelectedMetadatas(current =>
      !!index
        ? current.set(
            index,
            uniqBy(
              [...(current.get(index) ?? []), ...metadatas],
              metadata => metadata.id
            )
          )
        : uniqBy([...current, ...metadatas], metadata => metadata.id)
    );

    closeModal();
  }

  async function removeMetadata(mId: string) {
    // Remove the selected Metadata from the array:
    setSelectedMetadatas(current =>
      !!index
        ? current.set(
            index,
            current.get(index).filter(metadata => metadata.id !== mId)
          )
        : current.filter(metadata => metadata.id !== mId)
    );
  }

  function openAttachmentsModal() {
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
          <AttachmentSection
            allowAttachmentsConfig={allowAttachmentsConfig}
            afterMetadatasSaved={addAttachedMetadatas}
          />
        </div>
      </div>
    );
  }

  // Whether to disable the "Add Attachments" button:
  const addingAttachmentsDisabled =
    !allowAttachmentsConfig?.allowExisting && !allowAttachmentsConfig?.allowNew;

  const selectedMetasLen = !!index
    ? selectedMetadatas.get(index)
      ? selectedMetadatas.get(index).length
      : 0
    : selectedMetadatas.length;

  const attachedMetadatasUI = (
    <FieldSet
      id={id}
      legend={
        <>
          {title ?? "Attachments"} {!isTemplate ? `(${selectedMetasLen})` : ""}
        </>
      }
    >
      {!isTemplate ? (
        error ? (
          <DinaMessage id="objectStoreDataUnavailable" />
        ) : (
          <>
            {selectedMetasLen ? (
              <div className="mb-3">
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
                      Header: <FieldHeader name={formatMessage("remove")} />,
                      Cell: ({ original: { id: mId } }) => (
                        <button
                          className="btn btn-dark"
                          onClick={() => removeMetadata(mId)}
                          type="button"
                        >
                          <DinaMessage id="remove" />
                        </button>
                      )
                    }
                  ]}
                  data={
                    !!index ? selectedMetadatas.get(index) : selectedMetadatas
                  }
                  minRows={selectedMetasLen}
                  showPagination={false}
                />
              </div>
            ) : null}
            <button
              className="btn btn-primary mb-3"
              type="button"
              onClick={openAttachmentsModal}
              style={{ width: "10rem" }}
              disabled={addingAttachmentsDisabled}
            >
              <DinaMessage id="addAttachments" />
            </button>
          </>
        )
      ) : (
        <>
          {allowNewFieldName && (
            <CheckBoxWithoutWrapper
              className="allow-new-checkbox"
              name={allowNewFieldName}
              includeAllLabel={formatMessage("allowNew")}
            />
          )}
          {allowExistingFieldName && (
            <CheckBoxWithoutWrapper
              className="allow-existing-checkbox"
              name={allowExistingFieldName}
              includeAllLabel={formatMessage("allowExisting")}
            />
          )}
        </>
      )}
    </FieldSet>
  );

  return {
    addAttachedMetadatas,
    attachedMetadatasUI,
    removeMetadata,
    selectedMetadatas
  };
}
