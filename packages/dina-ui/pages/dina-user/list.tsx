import { ColumnDefinition, ListLayoutFilterType, ListPageLayout } from "common-ui";
import { PersistedResource } from "kitsu";
import Link from "next/link";
import { GroupSelectField } from "../../components";
import PageLayout from "packages/dina-ui/components/page/PageLayout";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";
import { Person } from "../../types/objectstore-api";
import { DinaUser } from "../../types/user-api/resources/DinaUser";
import { RolesPerGroupTable } from "./view";

/* DinaUser with the Person record joined in client-side. */
type DinaUserWithAgent = DinaUser & { agent?: Person };

const USER_FILTER_ATTRIBUTES = [
  "username",
  "firstName",
  "lastName",
  "emailAddress",
  "agent.displayName"
];

const DEFAULT_SORT = [{ id: "username", desc: false }];

/**
 * Applies the free-text search to a user.
 *
 * Filtering is done in-memory: the User API is Keycloak-backed in production, so the
 * visible user list is loaded once and filtered client-side. The back-end already
 * restricts which users are returned based on the caller's roles.
 */
export function userFilterFn(
  filterForm: any,
  user: PersistedResource<DinaUserWithAgent>
): boolean {
  const searchText: string = filterForm?.filterBuilderModel?.value?.trim()?.toLowerCase() ?? "";
  const group: string | undefined = filterForm?.group || undefined;

  if (searchText) {
    const matchesText = [
      user.username,
      user.firstName,
      user.lastName,
      user.emailAddress,
      user.agent?.displayName
    ].some((text) => text?.toLowerCase().includes(searchText));

    if (!matchesText) {
      return false;
    }
  }

  const rolesPerGroup = user.rolesPerGroup ?? {};

  if (group && !Object.keys(rolesPerGroup).includes(group)) {
    return false;
  }

  return true;
}

const USER_TABLE_COLUMNS: ColumnDefinition<DinaUserWithAgent>[] = [
  {
    cell: ({
      row: {
        original: { id, username }
      }
    }) => (
      <Link href={`/dina-user/view?id=${id}`} legacyBehavior>
        {username}
      </Link>
    ),
    accessorKey: "username"
  },
  {
    // Same terminology as the user view page
    header: () => <DinaMessage id="associatedAgent" />,
    cell: ({
      row: {
        original: { agent }
      }
    }) =>
      agent?.id ? (
        <Link href={`/person/view?id=${agent.id}`} legacyBehavior>
          {agent.displayName}
        </Link>
      ) : null,
    accessorKey: "agent.displayName",
    enableSorting: false
  },
  "emailAddress",
  {
    cell: ({
      row: {
        original: { rolesPerGroup, adminRoles }
      }
    }) => (
      <>
        <RolesPerGroupTable
          rolesPerGroup={rolesPerGroup ?? {}}
          hideTitle={true}
          hideTable={!rolesPerGroup || Object.keys(rolesPerGroup).length === 0}
        />
        {/* Realm-level admin roles are not part of rolesPerGroup; show them too so
            results of the admin role filters are visible in the table. */}
        {!!adminRoles?.length && (
          <div>
            {adminRoles.map((role) => (
              <span key={role} className="badge bg-primary me-1">
                {role}
              </span>
            ))}
          </div>
        )}
      </>
    ),
    accessorKey: "rolesPerGroup",
    enableSorting: false
  }
];

const USER_TABLE_QUERY_PROPS = {
  columns: USER_TABLE_COLUMNS,
  path: "user-api/user",
  joinSpecs: [
    {
      apiBaseUrl: "/agent-api",
      idField: "agentId",
      joinField: "agent",
      path: (user) => `person/${user.agentId}`
    }
  ]
};

export default function DinaUserListPage() {
  return (
    <PageLayout titleId="userListTitle">
        <ListPageLayout<DinaUserWithAgent>
          id="user-list"
          filterType={ListLayoutFilterType.FREE_TEXT}
          filterAttributes={USER_FILTER_ATTRIBUTES}
          enableInMemoryFilter={true}
          filterFn={userFilterFn}
          filterFormchildren={({ submitForm }) => (
            <div className="d-flex gap-3 flex-wrap mb-3">
              <div style={{ width: "300px" }}>
                <GroupSelectField
                  onChange={() => setImmediate(submitForm)}
                  name="group"
                  showAnyOption={true}
                />
              </div>
            </div>
          )}
          queryTableProps={USER_TABLE_QUERY_PROPS}
          defaultSort={DEFAULT_SORT}
        />
    </PageLayout>
  );
}
