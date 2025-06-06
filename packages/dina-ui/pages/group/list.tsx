import {
  ColumnDefinition,
  CreateButton,
  ListPageLayout,
  useAccount
} from "common-ui";
import Link from "next/link";
import PageLayout from "packages/dina-ui/components/page/PageLayout";

const GROUP_TABLE_COLUMNS: ColumnDefinition<any>[] = [
  {
    cell: ({
      row: {
        original: { id, name }
      }
    }) => (
      <Link href={`/group/view?id=${id}`} legacyBehavior>
        {name}
      </Link>
    ),
    accessorKey: "name"
  },
  {
    cell: ({
      row: {
        original: { path }
      }
    }) => path,
    accessorKey: "path"
  }
];

export default function GroupListPage() {
  const { isAdmin } = useAccount();
  const buttonBarContent = (
    <div className="flex d-flex ms-auto">
      {isAdmin && <CreateButton entityLink="/group" />}
    </div>
  );

  return (
    <PageLayout titleId="groupListTitle" buttonBarContent={buttonBarContent}>
      <ListPageLayout
        defaultSort={[{ id: "name", desc: false }]}
        id="group-list"
        queryTableProps={{
          columns: GROUP_TABLE_COLUMNS,
          path: "user-api/group"
        }}
      />
    </PageLayout>
  );
}
