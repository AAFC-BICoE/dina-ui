import {
  SelectField,
  SelectFieldProps,
  SelectOption,
  useAccount,
  useQuery
} from "common-ui";
import { useFormikContext } from "formik";
import { useDinaIntl } from "../../intl/dina-ui-intl";
import { Group } from "../../types/user-api";

interface GroupSelectFieldProps extends Omit<SelectFieldProps, "options"> {
  showAnyOption?: boolean;

  /**
   * Show all groups, even those the user doesn't belong to.
   * The default (false) is to only show the groups the user belongs to.
   */
  showAllGroups?: boolean;
  /**
   * Show group set previously, applys to list/search group dropdown
   */
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
  const { initialValues } = useFormikContext<any>();

  let defaultValue: SelectOption<string> | undefined;

  const initialGroupName = initialValues[selectFieldProps.name];

  const shouldDisable =
    !myGroupNames?.includes(initialGroupName as any) &&
    initialGroupName !== undefined;

  const { response } = useQuery<Group[]>({
    path: "user-api/group",
    page: { limit: 1000 },
    // Get the group from backend when groupName is not within current user's group
    filter: showAllGroups
      ? undefined
      : shouldDisable
      ? JSON.stringify({ name: [initialGroupName] })
      : JSON.stringify({ name: myGroupNames })
  });

  const groupOptions: SelectOption<string>[] | undefined = response?.data?.map(
    group => ({
      label: group.labels[locale] ?? group.name,
      value: group.name
    })
  );

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
      disabled={shouldDisable}
    />
  );
}
