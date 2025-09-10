import {
  CheckBoxWithoutWrapper,
  FieldHeader,
  FieldSet,
  FieldSpy,
  LoadingSpinner,
  ReactTable,
  Tooltip,
  useBulkGet,
  useDinaFormContext,
  useModal,
  useQuery
} from "common-ui";
import { ResourceIdentifierObject } from "jsonapi-typescript";
import _ from "lodash";
import Link from "next/link";
import { CSSProperties, ReactNode } from "react";
import { AllowAttachmentsConfig, AttachmentSection } from "..";
import { ThumbnailCell } from "../..";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { Metadata } from "../../../types/objectstore-api";
import { AttachmentReadOnlySection } from "./AttachmentReadOnlySection";
import classNames from "classnames";
import { KitsuResource, PersistedResource } from "kitsu";
import { ColumnDef } from "@tanstack/react-table";

export interface AttachmentsFieldProps {
  /**
   * Attachment field name.
   *
   * e.g. "attachment" for an Assemblage entity which has "attachment" relationship.
   */
  name: string;

  /**
   * The base API of the parent entity to which the attachments will be associated.
   *
   * e.g. "collection-api" for an Assemblage entity which has "attachment" relationship.
   */
  attachmentParentBaseApi: string;

  /**
   * ID of the parent entity to which attachments will be associated.
   *
   * e.g. the ID of an Assemblage entity which has "attachment" relationship.
   */
  attachmentParentId: string;

  /**
   * Type of the parent entity to which attachments will be associated.
   *
   * e.g. "assemblages" for an Assemblage entity which has "attachment" relationship.
   */
  attachmentParentType: string;

  /**
   * Optional ID for the FieldSet surrounding this component.
   */
  formId?: string;

  title?: ReactNode;

  allowNewFieldName?: string;

  allowExistingFieldName?: string;

  /**
   * Manually set whether new/existing attachments can be added. By default allow both.
   */
  allowAttachmentsConfig?: AllowAttachmentsConfig;

  hideAddAttchmentBtn?: boolean;

  hideRemoveBtn?: boolean;

  hideAttachmentForm?: boolean;

  hideTitle?: boolean;

  hideCard?: boolean;

  wrapContent?: (content: ReactNode) => ReactNode;
}

export function AttachmentsField(props: AttachmentsFieldProps) {
  const { readOnly } = useDinaFormContext();

  return readOnly ? (
    <AttachmentReadOnlySection
      name={props.name}
      attachmentParentBaseApi={props.attachmentParentBaseApi}
      attachmentParentType={props.attachmentParentType}
      attachmentParentId={props.attachmentParentId}
      detachTotalSelected={true}
      title={props.title}
    />
  ) : (
    <FieldSpy fieldName={props.name}>
      {(value, { form }) => {
        const metadatas =
          _.uniqBy(value as ResourceIdentifierObject[] | undefined, "id") ?? [];
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
  formId,
  title,
  allowExistingFieldName,
  allowNewFieldName,
  hideAddAttchmentBtn,
  hideRemoveBtn,
  hideAttachmentForm,
  hideTitle,
  hideCard,
  allowAttachmentsConfig = { allowExisting: true, allowNew: true },
  wrapContent = (content) => content,
  name
}: AttachmentsEditorProps) {
  const { isTemplate } = useDinaFormContext();
  const { formatMessage } = useDinaIntl();
  const { closeModal } = useModal();

  // Just check if the object-store is up:
  const { error: objectStoreError } = useQuery<[]>({
    path: "objectstore-api/metadata"
  });

  const { data: metadatas, loading } = useBulkGet<Metadata>({
    ids: value.map((it) => it.id),
    listPath: "objectstore-api/metadata?include=derivatives"
  });

  function removeMetadata(removedId: string) {
    const newMetadatas = value.filter((it) => it.id !== removedId);
    onChange(newMetadatas);
  }

  // Whether to disable the "Add Attachments" button:
  const addingAttachmentsDisabled =
    !allowAttachmentsConfig?.allowExisting && !allowAttachmentsConfig?.allowNew;

  const COLUMNS: ColumnDef<PersistedResource<KitsuResource | Metadata>>[] = [
    ThumbnailCell({
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
            legacyBehavior
          >
            {(metadata as any)?.originalFilename ?? metadata.id}
          </Link>
        );
      }
    },
    ...["acCaption", "xmpMetadataDate", "acTags"].map((accessor) => ({
      id: accessor,
      accessorKey: accessor,
      header: () => <FieldHeader name={accessor} />
    })),
    {
      id: "actionColumn",
      size: 0,
      header: () => <FieldHeader name={formatMessage("remove")} />,
      cell: ({
        row: {
          original: { id: mId }
        }
      }) => (
        <button
          className="btn btn-dark remove-attachment"
          onClick={() =>
            removeMetadata(
              mId?.replace("?include=derivatives", "") ?? "unknown"
            )
          }
          type="button"
        >
          <DinaMessage id="remove" />
        </button>
      )
    }
  ];

  return (
    <FieldSet
      id={formId}
      legend={
        hideTitle ? (
          <></>
        ) : (
          <>
            {title ?? "Attachments"} {!isTemplate ? `(${value.length})` : ""}
          </>
        )
      }
      fieldName={name}
      removePadding={hideCard ?? false}
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
                  <ReactTable
                    columns={
                      hideRemoveBtn
                        ? COLUMNS.slice(0, COLUMNS.length - 1)
                        : COLUMNS
                    }
                    data={metadatas ?? []}
                  />
                </div>
              ) : null}
              {!hideAddAttchmentBtn ? (
                <AddAttachmentsButton
                  onChange={onChange}
                  value={value}
                  addingAttachmentsDisabled={addingAttachmentsDisabled}
                  allowAttachmentsConfig={allowAttachmentsConfig}
                />
              ) : (
                <>
                  {!hideAttachmentForm && (
                    <AttachmentSection
                      allowAttachmentsConfig={allowAttachmentsConfig}
                      afterMetadatasSaved={addAttachedMetadatas(
                        onChange,
                        value,
                        closeModal
                      )}
                    />
                  )}
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

interface AddAttachmentsButtonProps {
  allowAttachmentsConfig?: AllowAttachmentsConfig;
  addingAttachmentsDisabled?: boolean;
  value: ResourceIdentifierObject[];
  onChange: (newMetadatas: ResourceIdentifierObject[]) => void;
  buttonTextElement?: JSX.Element;
  style?: CSSProperties;
  className?: string;
  removeMargin?: boolean;
}

export function AddAttachmentsButton({
  value,
  onChange,
  allowAttachmentsConfig,
  addingAttachmentsDisabled,
  buttonTextElement,
  style,
  className,
  removeMargin
}: AddAttachmentsButtonProps) {
  const { closeModal, openModal } = useModal();
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
            afterMetadatasSaved={addAttachedMetadatas(
              onChange,
              value,
              closeModal
            )}
          />
        </div>
      </div>
    );
  }
  return (
    <button
      className={classNames(
        `btn btn-primary add-attachments`,
        !removeMargin && "mb-3",
        className
      )}
      type="button"
      onClick={openAttachmentsModal}
      style={style ?? { width: "10rem" }}
      disabled={addingAttachmentsDisabled}
    >
      {buttonTextElement ?? <DinaMessage id={"addAttachments"} />}
    </button>
  );
}

function addAttachedMetadatas(
  onChange: (newMetadatas: ResourceIdentifierObject[]) => void,
  value: ResourceIdentifierObject[],
  closeModal: () => void
): (metadataIds: string[]) => Promise<void> {
  return async (newIds) => {
    onChange(
      _.uniqBy(
        [...value, ...newIds.map((it) => ({ id: it, type: "metadata" }))],
        (val) => val.id
      )
    );
    closeModal();
  };
}
