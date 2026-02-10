import {
  ColumnDefinition,
  CreateButton,
  dateCell,
  ListPageLayout,
  SimpleSearchFilterBuilder
} from "common-ui";
import Link from "next/link";
import PageLayout from "packages/dina-ui/components/page/PageLayout";
import { Site } from "packages/dina-ui/types/collection-api";
import { groupCell, GroupSelectField, Head } from "../../../components";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";

export const getColumnDefinition: () => ColumnDefinition<Site>[] = () => {
  return [
    {
      cell: ({
        row: {
          original: { id }
        }
      }) => (
        <Link href={`/collection/site/view?id=${id}`}>
          <DinaMessage id="viewDetails" />
        </Link>
      ),
      accessorKey: "id",
      header: () => <DinaMessage id="viewDetails" />,
      enableSorting: false
    },
    "title",
    "code",
    groupCell("group"),
    "createdBy",
    dateCell("createdOn")
  ];
};

export default function SiteListPage() {
  const { formatMessage } = useDinaIntl();

  const SITE_FILTER_ATTRIBUTES = ["createdBy", "title", "code"];
  const SITE_TABLE_COLUMNS: ColumnDefinition<Site>[] = getColumnDefinition();

  return (
    <PageLayout
      titleId="siteListTitle"
      buttonBarContent={
        <div className="flex d-flex ms-auto">
          <CreateButton entityLink="/collection/site" />
        </div>
      }
    >
      <Head title={formatMessage("siteListTitle")} />
      <ListPageLayout
        additionalFilters={(filterForm) =>
          SimpleSearchFilterBuilder.create<Site>()
            .whereProvided("group", "EQ", filterForm.group)
            .build()
        }
        filterAttributes={SITE_FILTER_ATTRIBUTES}
        id="site-list"
        queryTableProps={{
          columns: SITE_TABLE_COLUMNS,
          path: "collection-api/site"
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
        useFiql={true}
      />
    </PageLayout>
  );
}
