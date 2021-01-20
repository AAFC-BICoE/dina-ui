import { useContext } from "react";
import { ApiClientContext } from "common-ui/lib/api-client/ApiClientContext";
import { UserGroup } from "packages/dina-ui/types/user-api/resources/UserGroup";
import { useGroupSelectOptions } from "packages/common-ui/lib/account/AccountProvider";
import { filterBy, SelectField, ResourceSelectField } from "common-ui/lib";

interface UserGroupProps {
  classes?: string;
}

export async function useUserGroups({ classes }: UserGroupProps) {
  const { apiClient } = useContext(ApiClientContext);
  const resp = await apiClient.get<UserGroup[]>("user-api/group", {});
  const groupSelectOptions = useGroupSelectOptions();

  let defaultGroup;
  groupSelectOptions.forEach(option => {
    resp.data.map(group => {
      option.value === group.name
        ? (defaultGroup = group)
        : (defaultGroup = null);
    });
  });

  return resp?.data?.length > 0 ? (
    <ResourceSelectField<UserGroup>
      name="group"
      filter={filterBy(["name"])}
      model="user-api/group"
      className={classes}
      optionLabel={group => group.name}
      defaultValue={defaultGroup ?? null}
    />
  ) : (
    <SelectField
      className={classes}
      name="group"
      options={groupSelectOptions}
    />
  );
}
