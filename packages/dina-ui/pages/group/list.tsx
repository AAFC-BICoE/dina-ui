import { useMemo } from "react";
import {
  ColumnDefinition,
  CreateButton,
  ListLayoutFilterType,
  ListPageLayout,
  LoadingSpinner,
  SelectField,
  useAccount,
  useInstanceContext
} from "common-ui";
import { GUEST, READ_ONLY, SUPER_USER, USER } from "common-ui/types/DinaRoles";
import { PersistedResource } from "kitsu";
import Link from "next/link";
import PageLayout from "../../components/page/PageLayout";
import { RoleBadges, useUserApiFilteringSupport } from "../../components";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";
import { Group } from "../../types/user-api";

/**
 * Attributes searched by the free-text search. The labels are a map keyed by language code,
 * which the User API can only search by path, so one attribute per supported language.
 */
function groupFilterAttributes(languages: string[]): string[] {
  return ["name", "path", ...languages.map((language) => `labels.${language}`)];
}

const DEFAULT_SORT = [{ id: "name", desc: false }];

/** fiql that matches no group (names are never blank), for filters that can't match anything. */
const NO_GROUP_FIQL = 'name==""';

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
const EMPTY_CELL = <span className="text-muted d-block text-center">—</span>;

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
 * membership / role / label-status dropdowns, when filtering in-memory (see
 * useUserApiFilteringSupport) the full group list is loaded once and filtered client-side.
 *
 * Must stay equivalent to groupFiqlFilter, which is used when the User API filters server-side.
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

/**
 * Converts the membership / role / label-status dropdowns to fiql, for when the User API
 * filters server-side. (The free-text search is converted to fiql by the ListPageLayout.)
 *
 * The membership and role filters compare each group against the signed-in user's own
 * Keycloak token, so they are expressed as the names of the matching groups.
 *
 * Must stay equivalent to groupFilterFn, which is used when filtering in-memory.
 */
export function groupFiqlFilter({
  myGroupNames,
  rolesPerGroup,
  locale
}: GroupFilterContext) {
  return (filterForm: any): string => {
    const membership: string | undefined = filterForm?.membership || undefined;
    const role: string | undefined = filterForm?.role || undefined;
    const labelStatus: string | undefined =
      filterForm?.labelStatus || undefined;

    const clauses: string[] = [];

    if (membership) {
      const names = myGroupNames ?? [];
      if (membership === MEMBER) {
        clauses.push(
          names.length ? `name=in=(${names.join(",")})` : NO_GROUP_FIQL
        );
      } else if (names.length) {
        clauses.push(names.map((name) => `name!=${name}`).join(";"));
      }
    }

    if (role) {
      const names = Object.entries(rolesPerGroup ?? {})
        .filter(([, roles]) => roles?.includes(role))
        .map(([name]) => name);
      clauses.push(
        names.length ? `name=in=(${names.join(",")})` : NO_GROUP_FIQL
      );
    }

    if (labelStatus) {
      // A missing label is either absent from the map or blank. (Unlike in-memory,
      // a whitespace-only label counts as present.)
      const label = `labels.${locale}`;
      clauses.push(
        labelStatus === HAS_LABEL
          ? `${label}!=null;${label}!=""`
          : `(${label}==null,${label}=="")`
      );
    }

    return clauses.join(";");
  };
}

export default function GroupListPage() {
  const { isAdmin, groupNames, rolesPerGroup } = useAccount();
  const { formatMessage, locale } = useDinaIntl();
  const instanceContext = useInstanceContext();

  // Filter server-side when the User API supports it, in-memory otherwise.
  const { loading: filteringSupportLoading, serverSideFiltering } =
    useUserApiFilteringSupport();

  const filterAttributes = useMemo(
    () =>
      groupFilterAttributes(
        instanceContext?.supportedLanguages?.split(",") ?? [locale]
      ),
    [instanceContext?.supportedLanguages, locale]
  );

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
        // The id is the User API's path to the label of the current locale, so the column
        // is sortable server-side. The accessor makes it sortable in-memory.
        id: `labels.${locale}`,
        header: () => <DinaMessage id="groupLabel" />,
        accessorFn: (group) => group.labels?.[locale] ?? "",
        cell: ({ getValue }) =>
          getValue<string>() ? <span>{getValue<string>()}</span> : EMPTY_CELL
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
  const fiqlFilter = useMemo(
    () => groupFiqlFilter({ myGroupNames: groupNames, rolesPerGroup, locale }),
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

  // Mount the list once the filtering mode is known, so the list isn't requested twice.
  if (filteringSupportLoading) {
    return (
      <PageLayout titleId="groupListTitle" buttonBarContent={buttonBarContent}>
        <LoadingSpinner loading={true} />
      </PageLayout>
    );
  }

  return (
    <PageLayout titleId="groupListTitle" buttonBarContent={buttonBarContent}>
      <ListPageLayout<Group>
        defaultSort={DEFAULT_SORT}
        id="group-list"
        filterType={ListLayoutFilterType.FREE_TEXT}
        filterAttributes={filterAttributes}
        filterFormClassName="list-filter-panel"
        filterPlaceholder={formatMessage("groupSearchPlaceholder")}
        // Re-filtering as the user types is only cheap in-memory, server-side each search is a request.
        liveSearch={!serverSideFiltering}
        enableInMemoryFilter={!serverSideFiltering}
        filterFn={filterFn}
        // Ignored in in-memory mode.
        additionalFiqlFilters={fiqlFilter}
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
