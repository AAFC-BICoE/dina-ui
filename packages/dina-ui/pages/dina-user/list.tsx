import {
  ClientSideJoinSpec,
  ColumnDefinition,
  FieldHeader,
  ListLayoutFilterType,
  ListPageLayout,
  SelectField,
  useQuery
} from "common-ui";
import {
  DINA_ADMIN,
  GUEST,
  READ_ONLY,
  READ_ONLY_ADMIN,
  SUPER_USER,
  USER
} from "common-ui/types/DinaRoles";
import { PersistedResource } from "kitsu";
import _ from "lodash";
import Link from "next/link";
import { useMemo } from "react";
import { GroupSelectField, RoleBadges } from "../../components";
import PageLayout from "packages/dina-ui/components/page/PageLayout";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";
import { Person } from "../../types/objectstore-api";
import { Group } from "../../types/user-api";
import { DinaUser } from "../../types/user-api/resources/DinaUser";

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

/* "agentLink" filter values. */
export const HAS_AGENT = "hasAgent";
export const MISSING_AGENT = "missingAgent";

/** Client-side join of each user's agent (Person) record from the Agent API. */
const USER_JOIN_SPECS: ClientSideJoinSpec[] = [
  {
    apiBaseUrl: "/agent-api",
    idField: "agentId",
    joinField: "agent",
    path: (user) => `person/${user.agentId}`
  }
];

/* Placeholder shown in empty table cells. */
const EMPTY_CELL = <span className="text-muted">—</span>;

/* The user's full name, as shown in the Name column. */
export function fullName({
  firstName,
  lastName
}: Pick<DinaUser, "firstName" | "lastName">): string {
  return [firstName, lastName].filter(Boolean).join(" ");
}

/**
 * Applies the free-text search and the group / role / agent-link dropdown filters to a user.
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
  const agentLink: string | undefined = filterForm?.agentLink || undefined;

  if (searchText) {
    const matchesText = [
      user.username,
      user.firstName,
      user.lastName,
      fullName(user),
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

  if (agentLink) {
    // Based on the stored agentId rather than the joined record, so the filter
    // is correct even while the agent records are still loading.
    const hasAgent = !!user.agentId;
    if (agentLink === HAS_AGENT ? !hasAgent : hasAgent) {
      return false;
    }
  }

  return true;
}

interface GroupRolesListProps {
  rolesPerGroup?: Record<string, string[] | undefined>;
  /* All groups keyed by name, to link each group and show its localized label. */
  groupsByName: Record<string, Group>;
  locale: string;
}

/* Lists the groups a user belongs to, each with the user's roles in that group. */
function GroupRolesList({
  rolesPerGroup,
  groupsByName,
  locale
}: GroupRolesListProps) {
  const groupNames = Object.keys(rolesPerGroup ?? {}).sort();

  if (!groupNames.length) {
    return EMPTY_CELL;
  }

  return (
    <ul className="list-unstyled mb-0 d-flex flex-column gap-1">
      {groupNames.map((groupName) => {
        const group = groupsByName[groupName];
        const label = group?.labels?.[locale] ?? groupName;
        return (
          <li
            key={groupName}
            className="d-flex align-items-center flex-wrap gap-2"
          >
            {group?.id ? (
              <Link href={`/group/view?id=${group.id}`} legacyBehavior>
                {label}
              </Link>
            ) : (
              <span>{label}</span>
            )}
            <RoleBadges roles={rolesPerGroup?.[groupName]} />
          </li>
        );
      })}
    </ul>
  );
}

export default function DinaUserListPage() {
  const { formatMessage, locale } = useDinaIntl();

  // Load the groups once for the whole table 
  // (labels and links) instead of one request per cell.
  const { response: groupsResponse } = useQuery<Group[]>({
    path: "user-api/group",
    page: { limit: 1000 }
  });

  const groupsByName = useMemo(
    () => _.keyBy(groupsResponse?.data ?? [], "name"),
    [groupsResponse]
  );

  const columns: ColumnDefinition<DinaUserWithAgent>[] = useMemo(
    () => [
      {
        accessorKey: "username",
        cell: ({
          row: {
            original: { id, username }
          }
        }) => (
          <Link href={`/dina-user/view?id=${id}`} legacyBehavior>
            {username}
          </Link>
        )
      },
      {
        id: "name",
        header: () => <FieldHeader name="name" />,
        // Derived from firstName + lastName, which the User API can't sort by as one field.
        cell: ({ row: { original } }) => fullName(original) || EMPTY_CELL,
        enableSorting: false
      },
      {
        accessorKey: "emailAddress",
        cell: ({
          row: {
            original: { emailAddress }
          }
        }) =>
          emailAddress ? (
            <a href={`mailto:${emailAddress}`}>{emailAddress}</a>
          ) : (
            EMPTY_CELL
          )
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
          ) : (
            EMPTY_CELL
          ),
        accessorKey: "agent.displayName",
        enableSorting: false
      },
      {
        id: "rolesPerGroup",
        header: () => <DinaMessage id="rolesPerGroup" />,
        cell: ({
          row: {
            original: { rolesPerGroup }
          }
        }) => (
          <GroupRolesList
            rolesPerGroup={rolesPerGroup}
            groupsByName={groupsByName}
            locale={locale}
          />
        ),
        enableSorting: false
      },
      {
        id: "adminRoles",
        // Realm-level admin roles are not part of rolesPerGroup; shown separately so
        // the results of the admin role filters are visible in the table.
        header: () => <DinaMessage id="adminRoles" />,
        cell: ({
          row: {
            original: { adminRoles }
          }
        }) =>
          adminRoles?.length ? <RoleBadges roles={adminRoles} /> : EMPTY_CELL,
        enableSorting: false
      }
    ],
    [groupsByName, locale]
  );

  // Keyed on the locale rather than on formatMessage, 
  // which is a new function on every render (and would defeat the memoization)
  const agentLinkOptions = useMemo(
    () => [
      { label: "<any>", value: undefined },
      { label: formatMessage("userHasAgent"), value: HAS_AGENT },
      { label: formatMessage("userMissingAgent"), value: MISSING_AGENT }
    ],
    [locale]
  );

  const queryTableProps = useMemo(
    () => ({
      columns,
      path: "user-api/user",
      joinSpecs: USER_JOIN_SPECS
    }),
    [columns]
  );

  return (
    <PageLayout titleId="userListTitle">
      <ListPageLayout<DinaUserWithAgent>
        id="user-list"
        filterType={ListLayoutFilterType.FREE_TEXT}
        filterAttributes={USER_FILTER_ATTRIBUTES}
        filterFormClassName="list-filter-panel"
        filterPlaceholder={formatMessage("userSearchPlaceholder")}
        liveSearch={true}
        enableInMemoryFilter={true}
        filterFn={userFilterFn}
        filterFormchildren={({ submitForm }) => (
          <div className="d-flex gap-3 flex-wrap">
            <div style={{ width: "230px" }}>
              <GroupSelectField
                onChange={() => setImmediate(submitForm)}
                name="group"
                showAnyOption={true}
              />
            </div>
            <div style={{ width: "230px" }}>
              <SelectField
                onChange={() => setImmediate(submitForm)}
                name="role"
                label={formatMessage("role")}
                options={ROLE_OPTIONS}
              />
            </div>
            <div style={{ width: "230px" }}>
              <SelectField
                onChange={() => setImmediate(submitForm)}
                name="agentLink"
                label={formatMessage("agentLinkStatus")}
                options={agentLinkOptions}
              />
            </div>
          </div>
        )}
        queryTableProps={queryTableProps}
        defaultSort={DEFAULT_SORT}
        wrapTable={(table) => <div className="dina-list-table">{table}</div>}
      />
    </PageLayout>
  );
}
