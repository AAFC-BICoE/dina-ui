import { useMemo } from "react";
import {
  ColumnDefinition,
  CreateButton,
  ListLayoutFilterType,
  ListPageLayout,
  SelectField,
  useAccount
} from "common-ui";
import { GUEST, READ_ONLY, SUPER_USER, USER } from "common-ui/types/DinaRoles";
import { PersistedResource } from "kitsu";
import Link from "next/link";
import PageLayout from "packages/dina-ui/components/page/PageLayout";
import { RoleBadges } from "../../components";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";
import { Group } from "../../types/user-api";

const GROUP_FILTER_ATTRIBUTES = ["name", "path", "labels"];
const DEFAULT_SORT = [{ id: "name", desc: false }];

/** Roles a user can hold within a group, as they appear in rolesPerGroup values. */
const GROUP_BASED_ROLES = [SUPER_USER, USER, GUEST, READ_ONLY];

const ROLE_OPTIONS = [
  { label: "<any>", value: undefined },
  ...GROUP_BASED_ROLES.map((roleName) => ({
    label: roleName,
    value: roleName
  }))
];

/** "membership" filter values. */
export const MEMBER = "member";
export const NON_MEMBER = "nonMember";

/** "labelStatus" filter values. */
export const HAS_LABEL = "hasLabel";
export const MISSING_LABEL = "missingLabel";

/** Placeholder shown in empty table cells. */
const EMPTY_CELL = <span className="text-muted">—</span>;

/** The current user's account details the filters depend on. */
export interface GroupFilterContext {
  /** Names of the groups the current user belongs to. */
  myGroupNames?: string[];
  /** The current user's roles, keyed by group name. */
  rolesPerGroup?: Record<string, string[] | undefined>;
  /** The UI locale, i.e. the language of the label shown in the Label column. */
  locale: string;
}

/**
 * Builds the predicate applied to each group by the free-text search and the
 * membership / role / label-status dropdowns.
 *
 * Filtering is done in-memory: the User API (Keycloak-backed in production) ignores
 * fiql filters and only applies simple filters within the already-fetched page, so
 * the full group list is loaded once and filtered client-side instead. The membership
 * and role filters are only derivable client-side anyway, since they compare each
 * group against the signed-in user's own Keycloak token.
 */
export function groupFilterFn({
  myGroupNames,
  rolesPerGroup,
  locale
}: GroupFilterContext) {
  return (filterForm: any, group: PersistedResource<Group>): boolean => {
    const searchText: string =
      filterForm?.filterBuilderModel?.value?.trim()?.toLowerCase() ?? "";
    const membership: string | undefined = filterForm?.membership || undefined;
    const role: string | undefined = filterForm?.role || undefined;
    const labelStatus: string | undefined =
      filterForm?.labelStatus || undefined;

    // Case-insensitive search across the name, the path and the labels in every
    // language, so a group can be found by its French label while the UI is in English.
    if (searchText) {
      const matchesText = [
        group.name,
        group.path,
        ...Object.values(group.labels ?? {})
      ].some((text) => text?.toLowerCase().includes(searchText));
      if (!matchesText) {
        return false;
      }
    }

    if (membership) {
      const isMember = !!group.name && !!myGroupNames?.includes(group.name);
      if (membership === MEMBER ? !isMember : isMember) {
        return false;
      }
    }

    if (role) {
      const myRoles = group.name ? rolesPerGroup?.[group.name] ?? [] : [];
      if (!myRoles.includes(role)) {
        return false;
      }
    }

    if (labelStatus) {
      // Matches the Label column, which shows the label for the current locale only.
      const hasLabel = !!group.labels?.[locale]?.trim();
      if (labelStatus === HAS_LABEL ? !hasLabel : hasLabel) {
        return false;
      }
    }

    return true;
  };
}

export default function GroupListPage() {
  const { isAdmin, groupNames, rolesPerGroup } = useAccount();
  const { formatMessage, locale } = useDinaIntl();

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
        // The accessor makes the column sortable client-side
        // (sorting is in-memory on this page, like the filtering).
        accessorFn: (group) => group.labels?.[locale] ?? "",
        cell: ({ getValue }) => getValue<string>() || EMPTY_CELL
      },
      {
        cell: ({
          row: {
            original: { path }
          }
        }) => <span className="font-monospace">{path}</span>,
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
        }) => {
          const myRoles = rolesPerGroup?.[name];
          return myRoles?.length ? <RoleBadges roles={myRoles} /> : EMPTY_CELL;
        },
        enableSorting: false
      }
    ],
    [locale, rolesPerGroup]
  );

  // Keyed on the locale rather than on formatMessage, which is a new function on
  // every render and would defeat the memoization.
  const membershipOptions = useMemo(
    () => [
      { label: "<any>", value: undefined },
      { label: formatMessage("groupsIBelongTo"), value: MEMBER },
      { label: formatMessage("groupsIDoNotBelongTo"), value: NON_MEMBER }
    ],
    [locale]
  );

  const labelStatusOptions = useMemo(
    () => [
      { label: "<any>", value: undefined },
      { label: formatMessage("groupHasLabel"), value: HAS_LABEL },
      { label: formatMessage("groupMissingLabel"), value: MISSING_LABEL }
    ],
    [locale]
  );

  const filterFn = useMemo(
    () => groupFilterFn({ myGroupNames: groupNames, rolesPerGroup, locale }),
    [groupNames, rolesPerGroup, locale]
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
        filterFormClassName="list-filter-panel"
        filterPlaceholder={formatMessage("groupSearchPlaceholder")}
        liveSearch={true}
        enableInMemoryFilter={true}
        filterFn={filterFn}
        filterFormchildren={({ submitForm }) => (
          <div className="d-flex gap-3 flex-wrap">
            <div style={{ width: "230px" }}>
              <SelectField
                onChange={() => setImmediate(submitForm)}
                name="membership"
                label={formatMessage("groupMembership")}
                options={membershipOptions}
              />
            </div>
            <div style={{ width: "230px" }}>
              <SelectField
                onChange={() => setImmediate(submitForm)}
                name="role"
                label={formatMessage("myRoleInGroup")}
                options={ROLE_OPTIONS}
              />
            </div>
            <div style={{ width: "230px" }}>
              <SelectField
                onChange={() => setImmediate(submitForm)}
                name="labelStatus"
                label={formatMessage("groupLabelStatus")}
                options={labelStatusOptions}
              />
            </div>
          </div>
        )}
        queryTableProps={queryTableProps}
        wrapTable={(table) => <div className="dina-list-table">{table}</div>}
      />
    </PageLayout>
  );
}
