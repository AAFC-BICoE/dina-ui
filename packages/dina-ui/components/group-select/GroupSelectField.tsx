import {
  SelectField,
  SelectFieldProps,
  SelectOption,
  useAccount,
  useQuery
} from "common-ui";
import { useDinaIntl } from "../../intl/dina-ui-intl";
import { Group } from "../../types/user-api";
import { useState } from "react";

interface GroupSelectFieldProps extends Omit<SelectFieldProps, "options"> {
  showAnyOption?: boolean;
  showAllGroups?: boolean;
  showDefaultValue?: boolean;
}

export function GroupSelectField(groupSelectFieldProps: GroupSelectFieldProps) {
  const {
    showAnyOption,
    showAllGroups,
    showDefaultValue,
    ...selectFieldProps
  } = groupSelectFieldProps;

  const { locale } = useDinaIntl();
  const { groupNames: myGroupNames } = useAccount();
  let defaultValue;

  const { response } = useQuery<Group[]>({
    path: "user-api/group",
    page: { limit: 1000 },
    filter: !showAllGroups ? JSON.stringify({ name: myGroupNames }) : undefined
  });

  const groupOptions = response?.data?.map(group => ({
    label: group.labels[locale] ?? group.name,
    value: group.name
  }));

  const groupSelectOptions: {
    label: string;
    value: string | undefined | null;
  }[] =
    groupOptions ??
    // If no labelled groups are available, fallback to unlabelled group names from useAccount:
    myGroupNames?.map(name => ({ label: name, value: name })) ??
    [];

  if (showAnyOption) {
    groupSelectOptions.unshift({ label: "<any>", value: undefined });
  }

  // find one option that matches user current group
  groupOptions?.forEach(option => {
    if (myGroupNames?.includes(option.value)) defaultValue = option;
  });

  return (
    <SelectField
      // Re-initizlize the component if the labels change:
      key={groupSelectOptions.map(option => option.label).join()}
      {...selectFieldProps}
      options={groupSelectOptions}
      defaultValue={showDefaultValue ? defaultValue : undefined}
    />
  );
}
