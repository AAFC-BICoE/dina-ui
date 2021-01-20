import { SelectField, SelectFieldProps, useAccount, useQuery } from "common-ui";
import { useDinaIntl } from "../../intl/dina-ui-intl";
import { Group } from "../../types/user-api";

interface GroupSelectFieldProps extends Omit<SelectFieldProps, "options"> {
  showAnyOption?: boolean;
}

export function GroupSelectField(groupSelectFieldProps: GroupSelectFieldProps) {
  const { showAnyOption, ...selectFieldProps } = groupSelectFieldProps;

  const { locale } = useDinaIntl();
  const { groupNames: myGroupNames } = useAccount();

  // Fetch all groups becuase there is no
  const { response } = useQuery<Group[]>({
    path: "user-api/group",
    page: { limit: 1000 },
    filter: JSON.stringify({ name: myGroupNames })
  });

  const groupSelectOptions: {
    label: string;
    value: string | undefined | null;
  }[] =
    response?.data?.map(group => ({
      label: group.labels[locale] ?? group.name,
      value: group.name
    })) ??
    // If no labelled groups are available, fallback to unlabelled group names from useAccount:
    myGroupNames?.map(name => ({ label: name, value: name })) ??
    [];

  if (showAnyOption) {
    groupSelectOptions.unshift({ label: "<any>", value: undefined });
  }

  return (
    <SelectField
      // Re-initizlize the component if the labels change:
      key={groupSelectOptions.map(option => option.label).join()}
      {...selectFieldProps}
      options={groupSelectOptions}
    />
  );
}
