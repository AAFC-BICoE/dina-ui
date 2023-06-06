import { ButtonBar, CreateButton, dateCell, ListPageLayout } from "common-ui";
import Link from "next/link";
import {
  Footer,
  GroupSelectField,
  Head,
  KeepContentsTogetherToggleForm,
  Nav
} from "../../../components";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import PageLayout from "../../../components/page/PageLayout";

const STORAGE_UNIT_TYPE_FILTER_ATTRIBUTES = ["name", "createdBy"];
const STORAGE_UNIT_TYPE_TABLE_COLUMNS = [
  {
    Cell: ({ original: { id, name } }) => (
      <Link href={`/collection/storage-unit-type/view?id=${id}`}>{name}</Link>
    ),
    accessor: "name"
  },
  "group",
  {
    Cell: ({ original }) => (
      <KeepContentsTogetherToggleForm initialValues={original} />
    ),
    accessor: "isInseperable"
  },
  "createdBy",
  dateCell("createdOn")
];

export default function StorageUnitTypeListPage() {
  const { formatMessage } = useDinaIntl();

  return (
    <PageLayout titleId={formatMessage("storageUnitTypeListTitle")}
    buttonBarContent = {<CreateButton entityLink="/collection/storage-unit-type" />} >
        <ListPageLayout
          additionalFilters={filterForm => ({
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
