import { ColumnDef } from "@tanstack/react-table";
import {
  dateCell,
  DinaForm,
  FieldHeader,
  FormikButton,
  ReactTable,
  Tooltip,
  useBulkGet,
  useGroupedCheckBoxes
} from "common-ui";
import { FormikContextType } from "formik";
import _ from "lodash";
import Link from "next/link";
import { ThumbnailCell } from "../..";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { useBulkMetadataEditModal } from "./useBulkMetadataEditModal";
import { ResourceIdentifierObject } from "jsonapi-typescript";
import { useEffect } from "react";
import { Metadata } from "packages/dina-ui/types/objectstore-api";

export interface ExistingAttachmentsTableProps {
  metadatas: ResourceIdentifierObject[];
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
  metadatas,
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

  useEffect(() => {
    setAvailableMetadatas(metadatas.map((m) => ({ id: m.id, type: m.type })));
  }, [metadatas, setAvailableMetadatas]);

  const ATTACHMENT_TABLE_COLUMNS: ColumnDef<Metadata>[] = [
    {
      id: "select",
      cell: ({ row: { original: metadata } }) => (
        <CheckBoxField key={metadata.id} resource={metadata} />
      ),
      header: () => <CheckBoxHeader />,
      enableSorting: false
    },
    ThumbnailCell({
      bucketField: "bucket",
      isJsonApiQuery: true
    }),
    {
      cell: ({
        row: {
          original: { id, ...metadata }
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

        return metadata?.filename ? (
          <Link
            href={`/object-store/object/view?id=${id}`}
            passHref={true}
            legacyBehavior
          >
            {metadata?.filename}
          </Link>
        ) : null;
      },
      accessorKey: "filename",
      header: () => <FieldHeader name="filename" />
    },
    {
      accessorKey: "acCaption",
      header: () => <FieldHeader name="acCaption" />
    },
    {
      id: "metataDate",
      ...dateCell("xmpMetadataDate"),
      header: () => <FieldHeader name="xmpMetadataDate" />
    },
    {
      cell: ({
        row: {
          original: { ...metadata }
        }
      }) => <>{metadata?.acTags?.join(", ")}</>,
      accessorKey: "acTags",
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

  const { data: metadataObjects, loading } = useBulkGet<Metadata>({
    ids: metadatas.map((m) => m.id),
    listPath: "objectstore-api/metadata?include=derivatives"
  });

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
      <ReactTable
        columns={ATTACHMENT_TABLE_COLUMNS}
        data={metadataObjects ?? ([] as any)}
        enableSorting={false}
        pageSize={10000}
        loading={loading}
      />
    </DinaForm>
  );
}
