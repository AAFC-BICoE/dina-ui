import {
  ColumnDefinition,
  CreateButton,
  ListPageLayout,
  useAccount
} from "common-ui";
import { PersistedResource } from "kitsu";
import Link from "next/link";
import PageLayout from "packages/dina-ui/components/page/PageLayout";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";
import { Group } from "../../types/user-api";

const GROUP_FILTER_ATTRIBUTES = ["name", "path", "labels"];

/**
 * Case-insensitive text search across the group's name, path and multilingual labels.
 *
 * Filtering is done in-memory: the User API (Keycloak-backed in production) ignores
 * fiql filters and only applies simple filters within the already-fetched page, so
 * the full group list is loaded once and filtered client-side instead.
 */
export function groupFilterFn(
  filterForm: any,
  group: PersistedResource<Group>
): boolean {
  const searchText: string =
    filterForm?.filterBuilderModel?.value?.trim()?.toLowerCase() ?? "";

  if (!searchText) {
    return true;
  }

  return [group.name, group.path, ...Object.values(group.labels ?? {})].some(
    (text) => text?.toLowerCase().includes(searchText)
  );
}

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
