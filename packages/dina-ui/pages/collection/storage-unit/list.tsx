import { CreateButton, FieldHeader, QueryPage, dateCell } from "common-ui";
import Link from "next/link";
import PageLayout from "../../../components/page/PageLayout";
import { TableColumn } from "common-ui/lib/list-page/types";

// Columns for the elastic search list page.
const columns: TableColumn<any>[] = [
  // Name
  {
    id: "name",
    cell: ({
      row: {
        original: { id, data }
      }
    }) => (
      <Link href={`/collection/storage-unit/view?id=${id}`} passHref={true}>
        {data?.attributes?.name}
      </Link>
    ),
    header: () => <FieldHeader name="name" />,
    accessorKey: "data.attributes.name",
    isKeyword: true
  },

  // Storage Unit Type
  {
    id: "storageUnitType.name",
    cell: ({
      row: {
        original: { included }
      }
    }) => {
      if (!included?.["storage-unit-type"]?.id) {
        return null;
      }

      return (
        <Link
          href={`/collection/storage-unit-type/view?id=${included?.["storage-unit-type"]?.id}`}
          passHref={true}
        >
          {included?.["storage-unit-type"]?.attributes?.name}
        </Link>
      );
    },
    header: () => <FieldHeader name="storageUnitType" />,
    accessorKey: "included.attributes.name",
    relationshipType: "storage-unit-type",
    enableSorting: false,
    isKeyword: true
  },

  // Location
  {
    id: "location",
    cell: ({
      row: {
        original: { data }
      }
    }) => {
      const parentRank = data?.attributes?.hierarchy?.find(
        (item) => item.rank === 2
      );
      return <>{parentRank?.name}</>;
    },
    header: () => <FieldHeader name="location" />,
    enableSorting: false,
    isKeyword: true,
    additionalAccessors: ["data.attributes.hierarchy"]
  },

  // Group
  {
    id: "group",
    header: () => <FieldHeader name="group" />,
    accessorKey: "data.attributes.group",
    isKeyword: true
  },

  // Created By
  {
    id: "createdBy",
    header: () => <FieldHeader name="createdBy" />,
    accessorKey: "data.attributes.createdBy",
    isKeyword: true
  },

  // Created On
  dateCell("createdOn", "data.attributes.createdOn")
];

export default function storageUnitListPage() {
  return (
    <PageLayout
      titleId="storageUnitListTitle"
      buttonBarContent={
        <div className="flex d-flex ms-auto">
          <CreateButton entityLink="/collection/storage-unit" />
        </div>
      }
    >
      <QueryPage
        indexName={"dina_storage_index"}
        uniqueName="storage-unit-list"
        reactTableProps={{
          enableSorting: true,
          enableMultiSort: true
        }}
        enableRelationshipPresence={true}
        columns={columns}
        mandatoryDisplayedColumns={["name"]}
        bulkDeleteButtonProps={{
          typeName: "storage-unit",
          apiBaseUrl: "/collection-api"
        }}
        bulkEditPath="/collection/storage-unit/bulk-edit"
      />
    </PageLayout>
  );
}
