import {
  DinaFormContext,
  SelectField,
  SelectFieldProps,
  useAccount,
  useDinaFormContext,
  useQuery
} from "common-ui";
import { useField } from "formik";
import _ from "lodash";
import React, { useContext, useEffect } from "react";
import { useDinaIntl } from "../../intl/dina-ui-intl";
import { Group } from "../../types/user-api";
import { GroupLabel } from "./GroupFieldView";
import { useStoredDefaultGroup } from "./useStoredDefaultGroup";

interface GroupSelectFieldProps extends Omit<SelectFieldProps<any>, "options"> {
  /** Show the "any" option. */
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

  /**
   * Determine if to hide the dropdown when the user has only one group.
   */
  hideWithOnlyOneGroup?: boolean;

  readOnlyHideLabel?: boolean;

  /**
   * State based version, instead of using formiks version.
   */
  groups?: string[] | string;
}

export function GroupSelectField(groupSelectFieldProps: GroupSelectFieldProps) {
  const {
    groups,
    showAnyOption,
    showAllGroups,
    enableStoredDefaultGroup = false,
    readOnlyHideLabel,
    hideWithOnlyOneGroup = true,
    ...selectFieldProps
  } = groupSelectFieldProps;

  const { isAdmin } = useAccount();
  const { initialValues, readOnly } = useDinaFormContext();
  const [{ value }, {}, { setValue }] = useField(selectFieldProps.name);

  // Check if the groups have been provided via state change.
  useEffect(() => {
    if (!groups) {
      return;
    }

    setValue(groups);
  }, [groups]);

  const { setStoredDefaultGroupIfEnabled } = useStoredDefaultGroup({
    enable: enableStoredDefaultGroup,
    groupFieldName: selectFieldProps.name
  });

  const initialGroupName = _.get(initialValues, selectFieldProps.name);

  const { groupSelectOptions } = useAvailableGroupOptions({
    initialGroupName,
    showAllGroups
  });

  const hasOnlyOneOption =
    enableStoredDefaultGroup && !isAdmin && groupSelectOptions.length === 1;

  useEffect(() => {
    if (hasOnlyOneOption && value === undefined) {
      setValue(groupSelectOptions[0].value);
    }
  }, [String(groupSelectOptions), hasOnlyOneOption]);

  // Hide the field when there is only one group to pick from:
  if (hasOnlyOneOption && !readOnly && hideWithOnlyOneGroup) {
    return <div />;
  }

  const options = [
    ...(showAnyOption ? [{ label: "<any>", value: undefined }] : []),
    ...groupSelectOptions
  ];

  return (
    <SelectField
      // Re-initialize the component if the labels change:
      key={groupSelectOptions.map((option) => option.label).join()}
      {...selectFieldProps}
      readOnlyRender={(groupName) =>
        groupName ? <GroupLabel groupName={groupName} /> : <div />
      }
      onChange={(newValue: string | null | undefined, formik) => {
        setStoredDefaultGroupIfEnabled(newValue);
        selectFieldProps.onChange?.(newValue, formik);
      }}
      options={options}
      selectProps={{
        isDisabled: hasOnlyOneOption,
        isClearable: false,
        ...selectFieldProps.selectProps
      }}
      hideLabel={readOnlyHideLabel && readOnly}
    />
  );
}

export interface UseAvailableGroupOptionsParams {
  initialGroupName?: string;

  /**
   * Show all groups, even those the user doesn't belong to.
   * The default (false) is to only show the groups the user belongs to.
   */
  showAllGroups?: boolean;
}

/**
 * Gets the available Group Select options based on whether the User API is available and
 * whether the User is a dina-admin.
 */
export function useAvailableGroupOptions({
  initialGroupName,
  showAllGroups
}: UseAvailableGroupOptionsParams = {}) {
  const { groupNames: myGroupNames, isAdmin } = useAccount();
  const { locale } = useDinaIntl();
  const { readOnly } = useContext(DinaFormContext) ?? {};

  const selectableGroupNames = _.uniq([
    // If the value is already set, include it in the dropdown regardless of user permissions.
    ...(initialGroupName
      ? Array.isArray(initialGroupName)
        ? initialGroupName
        : [initialGroupName]
      : []),
    // Include the group names the user belongs to.
    ...(myGroupNames ?? [])
  ]);

  const { response } = useQuery<Group[]>(
    {
      path: "user-api/group",
      page: { limit: 1000 },
      // Get the group from backend when groupName is not within current user's group
      filter:
        showAllGroups || isAdmin
          ? undefined
          : JSON.stringify({ name: selectableGroupNames })
    },
    {
      disabled: readOnly
    }
  );

  const groupOptions = response?.data?.map((group) => ({
    label: group.labels[locale] ?? group.name,
    value: group.name
  }));

  const groupSelectOptions =
    groupOptions ??
    // If no labelled groups are available, fallback to unlabelled group names from useAccount:
    selectableGroupNames.map((name) => ({ label: name, value: name })) ??
    [];

  return { groupSelectOptions };
}
