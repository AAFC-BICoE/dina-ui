import { useContext } from "react";
import { ApiClientContext } from "common-ui/lib/api-client/ApiClientContext";
import { UserGroup } from "packages/dina-ui/types/user-api/resources/UserGroup";
import {
  useAccount,
  useGroupSelectOptions
} from "packages/common-ui/lib/account/AccountProvider";
import { filterBy, SelectField, ResourceSelectField } from "common-ui/lib";
import { useLocalStorage } from "@rehooks/local-storage";
import { PersistedResource } from "kitsu";

interface UserGroupProps {
  classes?: string;
}

export function UserGroups({ classes }: UserGroupProps) {
  const { apiClient } = useContext(ApiClientContext);
  const groupSelectOptions = useGroupSelectOptions();
  const [storedLocale, setLocale] = useLocalStorage("locale");
  const locale = storedLocale ?? "en";

  const getUserGroups = async () =>
    await apiClient.get<UserGroup[]>("user-api/group", {});
  const resp = getUserGroups();
  let userGroups: PersistedResource<UserGroup>[];
  let length;

  resp.then(async () => {
    userGroups = (await resp).data;
    length = userGroups?.length;
  });

  let defaultGroup;
  groupSelectOptions.forEach(option => {
    userGroups.map(group => {
      option.value === group.name
        ? (defaultGroup = group)
        : (defaultGroup = null);
    });
  });

  return length > 0 ? (
    <ResourceSelectField<UserGroup>
      name="group"
      filter={filterBy(["name"])}
      model="user-api/group"
      className={classes}
      optionLabel={group => group.labels.get(locale) as string}
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
