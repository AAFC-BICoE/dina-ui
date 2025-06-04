import { dateCell, FieldHeader, QueryPage, stringArrayCell } from "common-ui";
import Link from "next/link";
import { ThumbnailCell } from "../..";
import { TableColumn } from "packages/common-ui/lib/list-page/types";

export interface ExistingObjectsAttacherProps {
  onMetadataIdsSubmitted: (metadataIds: string[]) => Promise<void>;
}

export function ExistingObjectsAttacher({
  onMetadataIdsSubmitted
}: ExistingObjectsAttacherProps) {
  const METADATA_TABLE_COLUMNS_QUERY_PAGE: TableColumn<any>[] = [
    ThumbnailCell({
      bucketField: "data.attributes.bucket"
    }),
    {
      header: () => <FieldHeader name="acCaption" />,
      accessorKey: "data.attributes.acCaption",
      isKeyword: true,
      id: "acCaption"
    },
    dateCell("acDigitizationDate", "data.attributes.acDigitizationDate"),
    dateCell("xmpMetadataDate", "data.attributes.xmpMetadataDate"),
    {
      cell: ({
        row: {
          original: { included }
        }
      }) =>
        included?.acMetadataCreator?.id ? (
          <Link href={`/person/view?id=${included?.acMetadataCreator?.id}`}>
            <a>{included?.acMetadataCreator?.attributes?.displayName}</a>
          </Link>
        ) : null,
      header: () => <FieldHeader name="acMetadataCreator.displayName" />,
      relationshipType: "person",
      accessorKey: "included.attributes.displayName",
      isKeyword: true,
      enableSorting: false,
      id: "acMetadataCreator.displayName"
    },
    {
      cell: ({
        row: {
          original: { included }
        }
      }) =>
        included?.dcCreator?.id ? (
          <Link href={`/person/view?id=${included?.dcCreator?.id}`}>
            <a>{included?.dcCreator?.attributes?.displayName}</a>
          </Link>
        ) : null,
      header: () => <FieldHeader name="dcCreator.displayName" />,
      relationshipType: "person",
      accessorKey: "included.attributes.displayName",
      isKeyword: true,
      enableSorting: false,
      id: "dcCreator.displayName"
    },
    stringArrayCell("acTags", "data.attributes.acTags")
  ];

  return (
    <QueryPage
      columns={METADATA_TABLE_COLUMNS_QUERY_PAGE}
      indexName={"dina_object_store_index"}
      uniqueName="existing-objects-attachment-list"
      enableColumnSelector={false}
      attachSelectedButtonsProps={{
        onAttachButtonClick: onMetadataIdsSubmitted
      }}
    />
  );
}
