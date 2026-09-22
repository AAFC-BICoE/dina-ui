import { FieldWrapper, FieldWrapperProps, useApiClient } from "common-ui";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";
import { Group } from "../../types/user-api";
import Link from "next/link";
import _ from "lodash";
import { useEffect, useState } from "react";

export type GroupFieldViewProps = Omit<FieldWrapperProps, "children">;

export function GroupFieldView(props: GroupFieldViewProps) {
  return (
    <FieldWrapper {...props}>
      {({ value: groupName }) => (
        <p className="group-label" style={{ minHeight: "25px" }}>
          <GroupLabel groupName={groupName} />
        </p>
      )}
    </FieldWrapper>
  );
}

/** Renders the group label (if available) or the group name. */
export function GroupLabel({ groupName }) {
  const { label, id } = useGroupLabel(groupName);
  return id ? (
    <Link href={`/group/view?id=${id}`} legacyBehavior>
      {<a style={{ color: "#525252" }}>{label}</a>}
    </Link>
  ) : (
    <>{label}</>
  );
}

/** Renders the Group label in the QueryTable. */
export function groupCell(accessorKey: string) {
  return {
    cell: ({ row: { original } }) => {
      const groupName = _.get(original, accessorKey);
      return <GroupLabel groupName={groupName} />;
    },
    header: () => <DinaMessage id="field_group" />,
    accessorKey
  };
}

/**
 * Group lookups are cached per group name and shared across all rows, so a
 * list page with many rows belonging to the same group only issues one
 * "user-api/group" request per group instead of one per row.
 */
const groupLabelCache = new Map<string, Group>();
const groupLabelInFlight = new Map<string, Promise<Group | undefined>>();

/** Returns the group label from the back-end. Returns the raw name for loading and error states. */
function useGroupLabel(groupName: string) {
  const { locale } = useDinaIntl();
  const { apiClient } = useApiClient();
  const cacheKey = groupName?.toLowerCase();

  const [group, setGroup] = useState<Group | undefined>(() =>
    cacheKey ? groupLabelCache.get(cacheKey) : undefined
  );

  useEffect(() => {
    if (!cacheKey || groupLabelCache.has(cacheKey)) {
      return;
    }

    let active = true;

    if (!groupLabelInFlight.has(cacheKey)) {
      const request = (async () => {
        try {
          const response: any = await apiClient.get("user-api/group", {
            filter: { name: cacheKey }
          });
          const fetchedGroup = response?.data?.[0] as Group | undefined;
          if (fetchedGroup) {
            groupLabelCache.set(cacheKey, fetchedGroup);
          }
          return fetchedGroup;
        } catch {
          return undefined;
        } finally {
          groupLabelInFlight.delete(cacheKey);
        }
      })();
      groupLabelInFlight.set(cacheKey, request);
    }

    groupLabelInFlight.get(cacheKey)!.then((fetchedGroup) => {
      if (active && fetchedGroup) {
        setGroup(fetchedGroup);
      }
    });

    return () => {
      active = false;
    };
  }, [cacheKey, apiClient]);

  return {
    label: group?.labels?.[locale] ?? groupName,
    id: group?.id
  };
}
