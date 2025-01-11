import {
  ColumnDefinition,
  CreateButton,
  ListPageLayout,
  useAccount
} from "common-ui";
import Link from "next/link";
import { Footer, GroupSelectField, Head, Nav } from "../../components";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";
import { DinaUser } from "packages/dina-ui/types/user-api";
import PageLayout from "packages/dina-ui/components/page/PageLayout";

const GROUP_TABLE_COLUMNS: ColumnDefinition<any>[] = [
  {
    cell: ({
      row: {
        original: { id, name }
      }
    }) => <Link href={`/group/view?id=${id}`}>{name}</Link>,
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
  const { formatMessage } = useDinaIntl();
  const { isAdmin } = useAccount();
  const buttonBarContent = (
    <div className="flex d-flex ms-auto">
      {isAdmin && <CreateButton entityLink="/group" />}
    </div>
  );

  return (
    <PageLayout titleId="groupListTitle" buttonBarContent={buttonBarContent}>
      <ListPageLayout
        additionalFilters={(filterForm) => ({
          // Apply group filter:
          ...(filterForm.group && { rsql: `group==${filterForm.group}` })
        })}
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
