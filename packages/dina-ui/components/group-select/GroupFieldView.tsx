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
          <GroupLabel groupName={groupName} />
        </FieldWrapper>
      )}
    </FastField>
  );
}

/** Renders the group label (if available) or the group name. */
export function GroupLabel({ groupName }) {
  const { locale } = useDinaIntl();
  const { response } = useQuery<Group[]>({
    path: "user-api/group",
    page: { limit: 1000 },
    filter: { name: groupName }
  });

  return (
    <p
      style={{
        borderBottom: "1px solid black",
        borderRight: "1px solid black",
        minHeight: "25px"
      }}
    >
      {response?.data?.[0]?.labels?.[locale] ?? groupName}
    </p>
  );
}
