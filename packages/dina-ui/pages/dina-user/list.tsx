import { ColumnDefinition, ListLayoutFilterType, ListPageLayout, SelectField } from "common-ui";
import { DINA_ADMIN, GUEST, READ_ONLY, READ_ONLY_ADMIN, SUPER_USER, USER } from "common-ui/types/DinaRoles";
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

/* Group-based role names as they appear in rolesPerGroup values. */
const GROUP_BASED_ROLES = [SUPER_USER, USER, GUEST, READ_ONLY];

/* Realm-level admin role names, stored in adminRoles instead of rolesPerGroup. */
const ADMIN_BASED_ROLES = [DINA_ADMIN, READ_ONLY_ADMIN];

const ROLE_OPTIONS = [
  { label: "<any>", value: undefined },
  ...[...GROUP_BASED_ROLES, ...ADMIN_BASED_ROLES].map((roleName) => ({
    label: roleName,
    value: roleName
  }))
];

/**
 * Applies the free-text search and the group/role dropdown filters to a user.
 *
 * Filtering is done in-memory: the User API is Keycloak-backed in production, so the
 * visible user list is loaded once and filtered client-side. The back-end already
 * restricts which users are returned based on the caller's roles.
 */
export function userFilterFn(
  filterForm: any,
  user: PersistedResource<DinaUserWithAgent>
): boolean {
  const searchText: string =
    filterForm?.filterBuilderModel?.value?.trim()?.toLowerCase() ?? "";
  const group: string | undefined = filterForm?.group || undefined;
  const role: string | undefined = filterForm?.role || undefined;

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

  if (role) {
    if (ADMIN_BASED_ROLES.includes(role)) {
      if (!user.adminRoles?.includes(role)) {
        return false;
      }
    } else {
      // Group-based role: check within the selected group, or any group if none selected.
      const groupRoles = group
        ? rolesPerGroup[group] ?? []
        : Object.values(rolesPerGroup).flatMap((roles) => roles ?? []);
      if (!groupRoles.includes(role)) {
        return false;
      }
    }
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
  const { formatMessage } = useDinaIntl();

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
            <div style={{ width: "300px" }}>
              <SelectField
                onChange={() => setImmediate(submitForm)}
                name="role"
                label={formatMessage("role")}
                options={ROLE_OPTIONS}
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
