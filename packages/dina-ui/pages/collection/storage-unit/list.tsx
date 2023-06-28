import {
  ColumnDefinition8,
  CreateButton,
  ListPageLayout,
  dateCell8
} from "common-ui";
import Link from "next/link";
import { GroupSelectField, StorageUnitBreadCrumb } from "../../../components";
import PageLayout from "../../../components/page/PageLayout";
import { StorageUnit } from "../../../types/collection-api";

const STORAGE_UNIT_FILTER_ATTRIBUTES = ["name", "createdBy", "barcode"];
const STORAGE_UNIT_TABLE_COLUMNS: ColumnDefinition8<StorageUnit>[] = [
  {
    cell: ({ row: { original: storage } }) => (
      <Link href={`/collection/storage-unit/view?id=${storage.id}`}>
        {storage.name}
      </Link>
    ),
    accessorKey: "name"
  },
  {
    cell: ({ row: { original: storage } }) => (
      <Link
        href={`/collection/storage-unit-type/view?id=${storage?.storageUnitType?.id}`}
      >
        {storage?.storageUnitType?.name}
      </Link>
    ),
    accessorKey: "storageUnitType",
    enableSorting: false
  },
  {
    cell: ({ row: { original } }) => (
      <StorageUnitBreadCrumb storageUnit={original} hideThisUnit={true} />
    ),
    accessorKey: "location",
    enableSorting: false
  },
  "group",
  "createdBy",
  dateCell8("createdOn")
];

export default function storageUnitListPage() {
  return (
    <PageLayout
      titleId="storageUnitListTitle"
      buttonBarContent={<CreateButton entityLink="/collection/storage-unit" />}
    >
      <ListPageLayout
        additionalFilters={(filterForm) => ({
          // Apply group filter:
          ...(filterForm.group && { rsql: `group==${filterForm.group}` })
        })}
        filterAttributes={STORAGE_UNIT_FILTER_ATTRIBUTES}
        id="storage-unit-list"
        queryTableProps={{
          columns: STORAGE_UNIT_TABLE_COLUMNS,
          path: "collection-api/storage-unit",
          include: "hierarchy,storageUnitType"
        }}
        filterFormchildren={({ submitForm }) => (
          <div className="mb-3">
            <div style={{ width: "300px" }}>
              <GroupSelectField
                onChange={() => setImmediate(submitForm)}
                name="group"
                showAnyOption={true}
              />
            </div>
          </div>
        )}
      />
    </PageLayout>
  );
}
