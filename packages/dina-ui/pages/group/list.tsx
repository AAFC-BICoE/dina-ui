import { useMemo } from "react";
import {
  ColumnDefinition,
  CreateButton,
  ListLayoutFilterType,
  ListPageLayout,
  useAccount
} from "common-ui";
import { PersistedResource } from "kitsu";
import Link from "next/link";
import PageLayout from "packages/dina-ui/components/page/PageLayout";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";
import { Group } from "../../types/user-api";

const GROUP_FILTER_ATTRIBUTES = ["name", "path", "labels"];
const DEFAULT_SORT = [{ id: "name", desc: false }];

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
  const { isAdmin, rolesPerGroup } = useAccount();
  const { locale } = useDinaIntl();

  const groupTableColumns: ColumnDefinition<Group>[] = useMemo(
    () => [
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
      },
      {
        id: "myRoles",
        header: () => <DinaMessage id="myRoleInGroup" />,
        // Shown so the results of the membership and role filters are visible
        // in the table instead of only narrowing the rows.
        cell: ({
          row: {
            original: { name }
          }
        }) => (
          <>
            {(rolesPerGroup?.[name] ?? []).map((role) => (
              <span key={role} className="badge bg-primary me-1">
                {role}
              </span>
            ))}
          </>
        ),
        enableSorting: false
      }
    ],
    [locale, rolesPerGroup]
  );

  const buttonBarContent = (
    <div className="flex d-flex ms-auto">
      {isAdmin && <CreateButton entityLink="/group" />}
    </div>
  );

  const queryTableProps = useMemo(
    () => ({
      columns: groupTableColumns,
      path: "user-api/group"
    }),
    [groupTableColumns]
  );

  return (
    <PageLayout titleId="groupListTitle" buttonBarContent={buttonBarContent}>
      <ListPageLayout<Group>
        defaultSort={DEFAULT_SORT}
        id="group-list"
        filterType={ListLayoutFilterType.FREE_TEXT}
        filterAttributes={GROUP_FILTER_ATTRIBUTES}
        enableInMemoryFilter={true}
        filterFn={groupFilterFn}
        queryTableProps={queryTableProps}
      />
    </PageLayout>
  );
}
