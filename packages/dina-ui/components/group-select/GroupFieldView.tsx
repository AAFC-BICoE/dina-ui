import { FieldWrapper, FieldWrapperProps, useQuery } from "common-ui";
import { useDinaIntl } from "../../intl/dina-ui-intl";
import { Group } from "../../types/user-api";

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
  const label = useGroupLabel(groupName);
  return <>{label}</>;
}

/** Renders the Group label in the QueryTable. */
export function groupCell(accessorKey: string) {
  return {
    cell: ({ row: { original } }) => {
      const groupName = original[accessorKey];
      return <GroupLabel groupName={groupName} />;
    },
    accessorKey
  };
}

/** Returns the group label from the back-end. Returns the raw name for loading and error states. */
function useGroupLabel(groupName: string) {
  const { locale } = useDinaIntl();
  const { response } = useQuery<Group[]>({
    path: "user-api/group",
    filter: { name: groupName }
  });

  return response?.data?.[0]?.labels?.[locale] ?? groupName;
}
