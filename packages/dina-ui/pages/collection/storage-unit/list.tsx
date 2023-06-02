import { ButtonBar, CreateButton, ListPageLayout, dateCell } from "common-ui";
import Link from "next/link";
import {
  Footer,
  GroupSelectField,
  Head,
  Nav,
  StorageUnitBreadCrumb
} from "../../../components";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import PageLayout from "../../../components/page/PageLayout";


const STORAGE_UNIT_FILTER_ATTRIBUTES = ["name", "createdBy", "barcode"];
const STORAGE_UNIT_TABLE_COLUMNS = [
  {
    Cell: ({ original: storage }) => (
      <Link href={`/collection/storage-unit/view?id=${storage.id}`}>
        {storage.name}
      </Link>
    ),
    accessor: "name"
  },
  {
    Cell: ({ original: storage }) => (
      <Link
        href={`/collection/storage-unit-type/view?id=${storage.storageUnitType.id}`}
      >
        {storage.storageUnitType.name}
      </Link>
    ),
    accessor: "storageUnitType",
    sortable: false
  },
  {
    Cell: ({ original }) => (
      <StorageUnitBreadCrumb storageUnit={original} hideThisUnit={true} />
    ),
    accessor: "location",
    sortable: false
  },
  "group",
  "createdBy",
  dateCell("createdOn")
];

export default function storageUnitListPage() {
  const { formatMessage } = useDinaIntl();

  return (
    <PageLayout titleId="storageUnitListTitle"
    buttonBarContent = {<CreateButton entityLink="/collection/storage-unit" />}>
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
