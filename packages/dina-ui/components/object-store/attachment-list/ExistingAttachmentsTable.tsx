import {
  ColumnDefinition,
  dateCell,
  FieldHeader,
  FormikButton,
  QueryTable,
  useGroupedCheckBoxes
} from "common-ui";
import { Form, Formik, FormikContextType } from "formik";
import { noop, toPairs } from "lodash";
import Link from "next/link";
import { DinaMessage } from "../../../intl/dina-ui-intl";
import { useBulkMetadataEditModal } from "./useBulkMetadataEditModal";

export interface ExistingAttachmentsTableProps {
  attachmentPath: string;
  onDetachMetadataIds: (metadataIds: string[]) => Promise<void>;
  onMetadatasEdited: () => Promise<void>;
}
export interface AttachmentsTableFormValues {
  /** Tracks which metadata IDs are selected. */
  selectedMetadatas: Record<string, boolean>;
}

/** Table showing existing attachment */
export function ExistingAttachmentsTable({
  attachmentPath,
  onDetachMetadataIds,
  onMetadatasEdited
}: ExistingAttachmentsTableProps) {
  const {
    CheckBoxField,
    CheckBoxHeader,
    setAvailableItems: setAvailableMetadatas
  } = useGroupedCheckBoxes({
    fieldName: "selectedMetadatas"
  });

  const { openMetadataEditorModal } = useBulkMetadataEditModal();

  const ATTACHMENT_TABLE_COLUMNS: ColumnDefinition<any>[] = [
    {
      Cell: ({ original: metadata }) => (
        <CheckBoxField key={metadata.id} resource={metadata} />
      ),
      Header: CheckBoxHeader,
      sortable: false
    },
    {
      Cell: ({ original: { id, metadata } }) =>
        metadata?.originalFilename ? (
          <Link href={`/object-store/object/view?id=${id}`}>
            {metadata?.originalFilename}
          </Link>
        ) : null,
      accessor: "metadata.originalFilename",
      Header: <FieldHeader name="originalFilename" />
    },
    {
      ...dateCell("metadata.acDigitizationDate"),
      Header: <FieldHeader name="acDigitizationDate" />
    },
    {
      ...dateCell("metadata.xmpMetadataDate"),
      Header: <FieldHeader name="xmpMetadataDate" />
    },
    {
      accessor: "metadata.acMetadataCreator.displayName",
      Header: <FieldHeader name="acMetadataCreator.displayName" />
    },
    {
      Cell: ({ original: { metadata } }) => <>{metadata?.acTags?.join(", ")}</>,
      accessor: "metadata.acTags",
      Header: <FieldHeader name="acTags" />
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
    const metadataIds = toPairs(selectedMetadatas)
      .filter(pair => pair[1])
      .map(pair => pair[0]);

    openMetadataEditorModal({
      afterMetadatasSaved: onMetadatasEdited,
      metadataIds
    });
  }

  async function detachSelectedMetadatas({
    selectedMetadatas
  }: AttachmentsTableFormValues) {
    const metadataIds = toPairs(selectedMetadatas)
      .filter(pair => pair[1])
      .map(pair => pair[0]);

    await onDetachMetadataIds(metadataIds);
  }

  return (
    <Formik<AttachmentsTableFormValues>
      initialValues={{ selectedMetadatas: {} }}
      onSubmit={noop}
    >
      <Form>
        <div className="list-inline" style={{ minHeight: "3rem" }}>
          <div className="list-inline-item float-right">
            <FormikButton
              buttonProps={bulkButtonProps}
              className="btn btn-primary ml-2 metadata-bulk-edit-button"
              onClick={editSelectedMetadatas}
            >
              <DinaMessage id="editSelectedButtonText" />
            </FormikButton>
            <FormikButton
              buttonProps={bulkButtonProps}
              className="btn btn-primary ml-2 metadata-bulk-edit-button"
              onClick={detachSelectedMetadatas}
            >
              <DinaMessage id="detachSelectedButtonText" />
            </FormikButton>
          </div>
        </div>
        <QueryTable
          columns={ATTACHMENT_TABLE_COLUMNS}
          joinSpecs={[
            {
              apiBaseUrl: "/objectstore-api",
              idField: "id",
              joinField: "metadata",
              path: metadataRef =>
                `metadata/${metadataRef.id}?include=acMetadataCreator`
            },
            {
              apiBaseUrl: "/agent-api",
              idField: "metadata.acMetadataCreator.id",
              joinField: "metadata.acMetadataCreator",
              path: metadataRef =>
                `person/${metadataRef.metadata?.acMetadataCreator?.id}`
            }
          ]}
          omitPaging={true}
          path={attachmentPath}
          reactTableProps={{ sortable: false }}
          defaultPageSize={10000}
          onSuccess={res => setAvailableMetadatas(res.data)}
        />
      </Form>
    </Formik>
  );
}
