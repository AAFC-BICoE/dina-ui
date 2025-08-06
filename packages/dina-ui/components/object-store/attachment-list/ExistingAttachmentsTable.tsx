import {
  ColumnDefinition,
  dateCell,
  DinaForm,
  FieldHeader,
  FormikButton,
  QueryTable,
  Tooltip,
  useGroupedCheckBoxes
} from "common-ui";
import { FormikContextType } from "formik";
import _ from "lodash";
import Link from "next/link";
import { ThumbnailCell } from "../..";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { useBulkMetadataEditModal } from "./useBulkMetadataEditModal";
import { metadataParser } from "../../../types/objectstore-api";

export interface ExistingAttachmentsTableProps {
  attachmentPath: string;
  onDetachMetadataIds?: (metadataIds: string[]) => Promise<void>;
  onMetadatasEdited?: () => void | Promise<void>;
  detachTotalSelected?: boolean;
}
export interface AttachmentsTableFormValues {
  /** Tracks which metadata IDs are selected. */
  selectedMetadatas: Record<string, boolean>;
}

/** Table showing existing attachment */
export function ExistingAttachmentsTable({
  attachmentPath,
  onDetachMetadataIds,
  onMetadatasEdited,
  detachTotalSelected
}: ExistingAttachmentsTableProps) {
  const {
    CheckBoxField,
    CheckBoxHeader,
    setAvailableItems: setAvailableMetadatas,
    DetachedTotalSelected
  } = useGroupedCheckBoxes({
    fieldName: "selectedMetadatas",
    detachTotalSelected
  });
  const { formatMessage } = useDinaIntl();

  const { openMetadataEditorModal } = useBulkMetadataEditModal();

  const ATTACHMENT_TABLE_COLUMNS: ColumnDefinition<any>[] = [
    {
      id: "select",
      cell: ({ row: { original: metadata } }) => (
        <CheckBoxField key={metadata.id} resource={metadata} />
      ),
      header: () => <CheckBoxHeader />,
      enableSorting: false
    },
    ThumbnailCell({
      bucketField: "metadata.bucket",
      isJsonApiQuery: true
    }),
    {
      cell: ({
        row: {
          original: { id, metadata }
        }
      }) => {
        // When this Metadata has been deleted, show a "deleted" message in this cell:
        if (!metadata) {
          return (
            <div>
              {`<${formatMessage("deleted")}>`}
              <Tooltip id="deletedMetadata_tooltip" intlValues={{ id }} />
            </div>
          );
        }

        return metadata?.originalFilename ? (
          <Link
            href={`/object-store/object/view?id=${id}`}
            passHref={true}
            legacyBehavior
          >
            {metadata?.originalFilename}
          </Link>
        ) : null;
      },
      accessorKey: "metadata.originalFilename",
      header: () => <FieldHeader name="originalFilename" />
    },
    {
      accessorKey: "metadata.acCaption",
      header: () => <FieldHeader name="acCaption" />
    },
    {
      id: "metataDate",
      ...dateCell("metadata.xmpMetadataDate"),
      header: () => <FieldHeader name="xmpMetadataDate" />
    },
    {
      cell: ({
        row: {
          original: { metadata }
        }
      }) => <>{metadata?.acTags?.join(", ")}</>,
      accessorKey: "metadata.acTags",
      header: () => <FieldHeader name="acTags" />
    }
  ];

  function bulkButtonProps({
    values: { selectedMetadatas }
  }: FormikContextType<AttachmentsTableFormValues>) {
    return {
      // Disable the button if none are selected:
      disabled: !Object.values(selectedMetadatas).reduce(
        (a, b) => a || b,
        false
      )
    };
  }

  async function editSelectedMetadatas({
    selectedMetadatas
  }: AttachmentsTableFormValues) {
    const metadataIds = _.toPairs(selectedMetadatas)
      .filter((pair) => pair[1])
      .map((pair) => pair[0]);

    openMetadataEditorModal({
      afterMetadatasSaved: onMetadatasEdited,
      metadataIds
    });
  }

  async function detachSelectedMetadatas({
    selectedMetadatas
  }: AttachmentsTableFormValues) {
    const metadataIds = _.toPairs(selectedMetadatas)
      .filter((pair) => pair[1])
      .map((pair) => pair[0]);

    await onDetachMetadataIds?.(metadataIds);
  }

  return (
    <DinaForm<AttachmentsTableFormValues>
      initialValues={{ selectedMetadatas: {} }}
    >
      <div className="list-inline" style={{ minHeight: "3rem" }}>
        <div className="float-start">
          {detachTotalSelected && <DetachedTotalSelected />}
        </div>
        <div className="float-end">
          <FormikButton
            buttonProps={bulkButtonProps}
            className="btn btn-primary ms-2 metadata-bulk-edit-button"
            onClick={editSelectedMetadatas}
          >
            <DinaMessage id="editSelectedAttachmentMetadata" />
          </FormikButton>
          {onDetachMetadataIds && (
            <FormikButton
              buttonProps={bulkButtonProps}
              className="btn btn-primary ms-2 metadata-detach-button"
              onClick={detachSelectedMetadatas}
            >
              <DinaMessage id="detachSelectedButtonText" />
            </FormikButton>
          )}
        </div>
      </div>
      <QueryTable
        columns={ATTACHMENT_TABLE_COLUMNS}
        joinSpecs={[
          {
            apiBaseUrl: "/objectstore-api",
            idField: "id",
            joinField: "metadata",
            path: (metadataRef) =>
              `metadata/${metadataRef.id}?include=acMetadataCreator,derivatives`
          },
          {
            apiBaseUrl: "/agent-api",
            idField: "metadata.acMetadataCreator.id",
            joinField: "metadata.acMetadataCreator",
            path: (metadataRef) =>
              `person/${metadataRef.metadata?.acMetadataCreator?.id}`
          }
        ]}
        omitPaging={true}
        path={attachmentPath}
        reactTableProps={{ enableSorting: false }}
        defaultPageSize={10000}
        onSuccess={(res) => setAvailableMetadatas(res.data)}
        parser={metadataParser}
        ariaLabel="Existing attachments"
      />
    </DinaForm>
  );
}
