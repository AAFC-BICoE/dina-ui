import {
  SelectField,
  SelectFieldProps,
  SelectOption,
  useAccount,
  useQuery
} from "common-ui";
import { useFormikContext } from "formik";
import { get, uniq } from "lodash";
import { useDinaIntl } from "../../intl/dina-ui-intl";
import { Group } from "../../types/user-api";
import { GroupLabel } from "./GroupFieldView";
import { useStoredDefaultGroup } from "./useStoredDefaultGroup";

interface GroupSelectFieldProps extends Omit<SelectFieldProps, "options"> {
  showAnyOption?: boolean;

  /**
   * Show all groups, even those the user doesn't belong to.
   * The default (false) is to only show the groups the user belongs to.
   */
  showAllGroups?: boolean;

  /**
   * Sets a default group from local storage if no initial value is set (e.g. from existing value in a group field).
   * This should be used in forms to add new data, not in search forms like list pages.
   */
  enableStoredDefaultGroup?: boolean;
}

export function GroupSelectField(groupSelectFieldProps: GroupSelectFieldProps) {
  const {
    showAnyOption,
    showAllGroups,
    enableStoredDefaultGroup = false,
    ...selectFieldProps
  } = groupSelectFieldProps;

  const { locale } = useDinaIntl();
  const { groupNames: myGroupNames } = useAccount();
  const { initialValues } = useFormikContext<any>();

  const { setStoredDefaultGroupIfEnabled } = useStoredDefaultGroup({
    enable: enableStoredDefaultGroup,
    groupFieldName: selectFieldProps.name
  });

  const initialGroupName = get(initialValues, selectFieldProps.name);

  const selectableGroupNames = uniq([
    // If the value is already set, include it in the dropdown regardless of user permissions.
    ...(initialGroupName ? [initialGroupName] : []),
    // Include the group names the user belongs to.
    ...(myGroupNames ?? [])
  ]);

  const { response } = useQuery<Group[]>({
    path: "user-api/group",
    page: { limit: 1000 },
    // Get the group from backend when groupName is not within current user's group
    filter: showAllGroups
      ? undefined
      : JSON.stringify({ name: selectableGroupNames })
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
    selectableGroupNames?.map(name => ({ label: name, value: name })) ??
    [];

  if (showAnyOption) {
    groupSelectOptions.unshift({ label: "<any>", value: undefined });
  }

  return (
    <SelectField
      // Re-initialize the component if the labels change:
      key={groupSelectOptions.map(option => option.label).join()}
      {...selectFieldProps}
      readOnlyRender={groupName =>
        groupName ? <GroupLabel groupName={groupName} /> : null
      }
      onChange={(newValue: string | null | undefined) => {
        setStoredDefaultGroupIfEnabled(newValue);
        selectFieldProps.onChange?.(newValue);
      }}
      options={groupSelectOptions}
    />
  );
}
