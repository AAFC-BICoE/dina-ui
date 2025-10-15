import {
  ColumnDefinition,
  CreateButton,
  dateCell,
  ListPageLayout
} from "common-ui";
import Link from "next/link";
import PageLayout from "packages/dina-ui/components/page/PageLayout";
import { Expedition } from "packages/dina-ui/types/collection-api";
import { groupCell, GroupSelectField, Head } from "../../../components";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";

export default function ExpeditionListPage() {
  const { formatMessage } = useDinaIntl();

  const EXPEDITION_FILTER_ATTRIBUTES = ["createdBy", "name"];
  const EXPEDITION_TABLE_COLUMNS: ColumnDefinition<Expedition>[] = [
    {
      cell: ({
        row: {
          original: { id }
        }
      }) => (
        <Link href={`/collection/expedition/view?id=${id}`}>
          <DinaMessage id="viewDetails" />
        </Link>
      ),
      accessorKey: "id",
      header: () => <DinaMessage id="viewDetails" />,
      enableSorting: false
    },
    "name",
    "geographicContext",
    "startDate",
    "endDate",
    groupCell("group"),
    "createdBy",
    dateCell("createdOn")
  ];

  return (
    <PageLayout
      titleId="expeditionListTitle"
      buttonBarContent={
        <div className="flex d-flex ms-auto">
          <CreateButton entityLink="/collection/expedition" />
        </div>
      }
    >
      <Head title={formatMessage("expeditionListTitle")} />
      <ListPageLayout
        additionalFilters={(filterForm) => ({
          // Apply group filter:
          ...(filterForm.group && { rsql: `group==${filterForm.group}` })
        })}
        filterAttributes={EXPEDITION_FILTER_ATTRIBUTES}
        id="expedition-list"
        queryTableProps={{
          columns: EXPEDITION_TABLE_COLUMNS,
          path: "collection-api/expedition"
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
