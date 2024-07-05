import { CreateButton, FieldHeader, QueryPage, dateCell } from "common-ui";
import Link from "next/link";
import { StorageUnitBreadCrumb } from "../../../components";
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
        <a>{data?.attributes?.name}</a>
      </Link>
    ),
    header: () => <FieldHeader name="name" />,
    accessorKey: "data.attributes.name"
  },

  // Storage Unit Type
  {
    id: "storageUnitType",
    cell: ({
      row: {
        original: { included }
      }
    }) => {
      return (
        <Link
          href={`/collection/storage-unit-type/view?id=${included?.storageUnitType?.id}`}
        >
          <>{included?.storageUnitType?.attributes?.name}</>
        </Link>
      );
    },
    header: () => <FieldHeader name="storageUnitType" />,
    accessorKey: "included.attributes.name",
    relationshipType: "storage-unit-type",
    enableSorting: false
  },

  // Location
  {
    id: "location",
    cell: ({
      row: {
        original: { data }
      }
    }) => <StorageUnitBreadCrumb storageUnit={data} hideThisUnit={true} />,
    header: () => <FieldHeader name="location" />,
    enableSorting: false
  },

  // Group
  {
    id: "group",
    header: () => <FieldHeader name="group" />,
    accessorKey: "data.attributes.group"
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
      />
    </PageLayout>
  );
}
