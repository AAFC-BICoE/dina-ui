import {
  ColumnDefinition,
  CreateButton,
  dateCell,
  ListPageLayout
} from "common-ui";
import Link from "next/link";
import { groupCell, GroupSelectField } from "../../../components";
import PageLayout from "../../../components/page/PageLayout";
import { useDinaIntl } from "../../../intl/dina-ui-intl";
import { StorageUnitType } from "../../../types/collection-api";

const STORAGE_UNIT_TYPE_FILTER_ATTRIBUTES = ["name", "createdBy"];
const STORAGE_UNIT_TYPE_TABLE_COLUMNS: ColumnDefinition<StorageUnitType>[] = [
  {
    cell: ({
      row: {
        original: { id, name }
      }
    }) => (
      <Link href={`/collection/storage-unit-type/view?id=${id}`} legacyBehavior>
        {name}
      </Link>
    ),
    accessorKey: "name"
  },
  groupCell("group"),
  "createdBy",
  dateCell("createdOn")
];

export default function StorageUnitTypeListPage() {
  const { formatMessage } = useDinaIntl();

  return (
    <PageLayout
      titleId={formatMessage("storageUnitTypeListTitle")}
      buttonBarContent={
        <div className="flex d-flex ms-auto">
          <CreateButton entityLink="/collection/storage-unit-type" />
        </div>
      }
    >
      <ListPageLayout
        additionalFilters={(filterForm) => ({
          // Apply group filter:
          ...(filterForm.group && { rsql: `group==${filterForm.group}` })
        })}
        filterAttributes={STORAGE_UNIT_TYPE_FILTER_ATTRIBUTES}
        id="storage-unit-type-list"
        queryTableProps={{
          columns: STORAGE_UNIT_TYPE_TABLE_COLUMNS,
          path: "collection-api/storage-unit-type"
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
