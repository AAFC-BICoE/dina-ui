import {
  ColumnDefinition,
  CreateButton,
  FieldHeader,
  ListPageLayout
} from "common-ui";
import Link from "next/link";
import PageLayout from "packages/dina-ui/components/page/PageLayout";

const SPLIT_CONFIG_TABLE_COLUMNS: ColumnDefinition<any>[] = [
  {
    cell: ({
      row: {
        original: { id, name }
      }
    }) => (
      <Link href={`/collection/split-configuration/edit?id=${id}`}>{name}</Link>
    ),
    accessorKey: "name",
    header: () => <FieldHeader name="name" />
  },
  "group"
];

export default function AgentListPage() {
  const buttonBarContent = (
    <div className="flex d-flex ms-auto">
      <CreateButton entityLink="/split-configuration" />
    </div>
  );

  return (
    <PageLayout
      titleId="splitConfigurationTitle"
      buttonBarContent={buttonBarContent}
    >
      <ListPageLayout
        id="split-config-list"
        queryTableProps={{
          columns: SPLIT_CONFIG_TABLE_COLUMNS,
          path: "collection-api/split-configuration"
        }}
      />
    </PageLayout>
  );
}
