import {
  ColumnDefinition,
  CreateButton,
  ListPageLayout,
  useAccount
} from "common-ui";
import Link from "next/link";
import PageLayout from "packages/dina-ui/components/page/PageLayout";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";
import { Group } from "../../types/user-api";

export default function GroupListPage() {
  const { isAdmin } = useAccount();
  const { locale } = useDinaIntl();

  const groupTableColumns: ColumnDefinition<Group>[] = [
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
      id: "label",
      header: () => <DinaMessage id="groupLabel" />,
      cell: ({ row: { original } }) => (
        <>{original.labels?.[locale] ?? ""}</>
      ),
      enableSorting: false
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

  const buttonBarContent = (
    <div className="flex d-flex ms-auto">
      {isAdmin && <CreateButton entityLink="/group" />}
    </div>
  );

  return (
    <PageLayout titleId="groupListTitle" buttonBarContent={buttonBarContent}>
      <ListPageLayout<Group>
        defaultSort={[{ id: "name", desc: false }]}
        id="group-list"
        queryTableProps={{
          columns: groupTableColumns,
          path: "user-api/group"
        }}
      />
    </PageLayout>
  );
}
