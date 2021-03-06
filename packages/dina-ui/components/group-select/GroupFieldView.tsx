import { FieldWrapper, FieldWrapperProps, useQuery } from "common-ui";
import { FastField, FieldProps } from "formik";
import { useDinaIntl } from "../../intl/dina-ui-intl";
import { Group } from "../../types/user-api";

export type GroupFieldViewProps = Omit<FieldWrapperProps, "children">;

export function GroupFieldView(props: GroupFieldViewProps) {
  return (
    <FastField name={props.name}>
      {({ field: { value: groupName } }: FieldProps) => (
        <FieldWrapper {...props}>
          <p
            className="group-label"
            style={{
              borderBottom: "1px solid black",
              borderRight: "1px solid black",
              minHeight: "25px"
            }}
          >
            <GroupLabel groupName={groupName} />
          </p>
        </FieldWrapper>
      )}
    </FastField>
  );
}

/** Renders the group label (if available) or the group name. */
export function GroupLabel({ groupName }) {
  const label = useGroupLabel(groupName);
  return <>{label}</>;
}

/** Renders the Group label in the QueryTable. */
export function groupCell(accessor: string) {
  return {
    Cell: ({ original }) => {
      const groupName = original[accessor];
      return <GroupLabel groupName={groupName} />;
    },
    accessor
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
