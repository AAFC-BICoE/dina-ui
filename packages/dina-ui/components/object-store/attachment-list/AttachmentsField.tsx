import {
  CheckBoxWithoutWrapper,
  FieldHeader,
  FieldSet,
  FieldSpy,
  LoadingSpinner,
  ReactTable8,
  Tooltip,
  useBulkGet,
  useDinaFormContext,
  useModal,
  useQuery
} from "common-ui";
import { ResourceIdentifierObject } from "jsonapi-typescript";
import { uniqBy } from "lodash";
import Link from "next/link";
import { ReactNode } from "react";
import { AllowAttachmentsConfig, AttachmentSection } from "..";
import { ThumbnailCell, ThumbnailCell8 } from "../..";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { Metadata } from "../../../types/objectstore-api";
import { AttachmentReadOnlySection } from "./AttachmentReadOnlySection";

export interface AttachmentsFieldProps {
  name: string;
  id?: string;
  title?: ReactNode;
  allowNewFieldName?: string;
  allowExistingFieldName?: string;
  /** Manually set whether new/existing attachments can be added. By default allow both. */
  allowAttachmentsConfig?: AllowAttachmentsConfig;
  /** Attachment API path for the read-only view. */
  attachmentPath: string;
  hideAddAttchmentBtn?: boolean;
  wrapContent?: (content: ReactNode) => ReactNode;
}

export function AttachmentsField(props: AttachmentsFieldProps) {
  const { readOnly } = useDinaFormContext();

  return readOnly ? (
    <AttachmentReadOnlySection
      attachmentPath={props.attachmentPath}
      detachTotalSelected={true}
      title={props.title}
    />
  ) : (
    <FieldSpy fieldName={props.name}>
      {(value, { form }) => {
        const metadatas =
          (value as ResourceIdentifierObject[] | undefined) ?? [];

        return (
          <AttachmentsEditor
            {...props}
            value={metadatas}
            onChange={(newMetadatas) =>
              form.setFieldValue(props.name, newMetadatas)
            }
          />
        );
      }}
    </FieldSpy>
  );
}

export interface AttachmentsEditorProps extends AttachmentsFieldProps {
  value: ResourceIdentifierObject[];
  onChange: (newMetadatas: ResourceIdentifierObject[]) => void;
}

export function AttachmentsEditor({
  value,
  onChange,
  id,
  title,
  allowExistingFieldName,
  allowNewFieldName,
  hideAddAttchmentBtn,
  allowAttachmentsConfig = { allowExisting: true, allowNew: true },
  wrapContent = (content) => content,
  name
}: AttachmentsEditorProps) {
  const { isTemplate, readOnly } = useDinaFormContext();
  const { formatMessage } = useDinaIntl();
  const { closeModal, openModal } = useModal();

  // Just check if the object-store is up:
  const { error: objectStoreError } = useQuery<[]>({
    path: "objectstore-api/metadata"
  });

  const { data: metadatas, loading } = useBulkGet<Metadata>({
    ids: value.map((it) => it.id),
    listPath: "objectstore-api/metadata?include=derivatives"
  });

  async function addAttachedMetadatas(newIds: string[]) {
    onChange(
      uniqBy(
        [...value, ...newIds.map((it) => ({ id: it, type: "metadata" }))],
        (val) => val.id
      )
    );
    closeModal();
  }

  function removeMetadata(removedId: string) {
    const newMetadatas = value.filter((it) => it.id !== removedId);
    onChange(newMetadatas);
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

  return (
    <FieldSet
      id={id}
      legend={
        <>
          {title ?? "Attachments"} {!isTemplate ? `(${value.length})` : ""}
        </>
      }
      fieldName={name}
    >
      {loading ? (
        <LoadingSpinner loading={true} />
      ) : !isTemplate ? (
        wrapContent(
          objectStoreError ? (
            <DinaMessage id="objectStoreDataUnavailable" />
          ) : (
            <>
              {value.length ? (
                <div className="mb-3">
                  <ReactTable8
                    columns={[
                      ThumbnailCell8({
                        bucketField: "bucket",
                        isJsonApiQuery: true
                      }),
                      {
                        id: "originalFilename",
                        header: () => <FieldHeader name="originalFilename" />,
                        cell: ({ row: { original: metadata } }) => {
                          // When this Metadata has been deleted, show a "deleted" message in this cell:
                          if (Object.keys(metadata).length === 2) {
                            return (
                              <div>
                                {`<${formatMessage("deleted")}>`}
                                <Tooltip
                                  id="deletedMetadata_tooltip"
                                  intlValues={{ id: metadata.id }}
                                />
                              </div>
                            );
                          }

                          return (
                            <Link
                              href={`/object-store/object/view?id=${metadata.id}`}
                            >
                              <a>
                                {(metadata as any)?.originalFilename ??
                                  metadata.id}
                              </a>
                            </Link>
                          );
                        }
                      },
                      ...["acCaption", "xmpMetadataDate", "acTags"].map(
                        (accessor) => ({
                          id: accessor,
                          accessorKey: accessor,
                          header: () => <FieldHeader name={accessor} />
                        })
                      ),
                      {
                        id: "actionColumn",
                        header: () => (
                          <FieldHeader name={formatMessage("remove")} />
                        ),
                        cell: ({
                          row: {
                            original: { id: mId }
                          }
                        }) => (
                          <button
                            className="btn btn-dark remove-attachment"
                            onClick={() =>
                              removeMetadata(
                                mId?.replace("?include=derivatives", "") ??
                                  "unknown"
                              )
                            }
                            type="button"
                          >
                            <DinaMessage id="remove" />
                          </button>
                        )
                      }
                    ]}
                    data={metadatas ?? []}
                  />
                </div>
              ) : null}
              {!hideAddAttchmentBtn ? (
                <button
                  className="btn btn-primary add-attachments mb-3"
                  type="button"
                  onClick={openAttachmentsModal}
                  style={{ width: "10rem" }}
                  disabled={addingAttachmentsDisabled}
                >
                  <DinaMessage id="addAttachments" />
                </button>
              ) : (
                <>
                  <AttachmentSection
                    allowAttachmentsConfig={allowAttachmentsConfig}
                    afterMetadatasSaved={addAttachedMetadatas}
                  />
                </>
              )}
            </>
          )
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
}
