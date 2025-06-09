import { useLocalStorage } from "@rehooks/local-storage";
import { useFormikContext } from "formik";
import _ from "lodash";
import { useEffect } from "react";

export const DEFAULT_GROUP_STORAGE_KEY = "default_group";

export interface StoredDefaultGroupParams {
  /** Whether the default group should be used. */
  enable: boolean;

  /** The name of the form's group field. */
  groupFieldName: string;
}

export function useStoredDefaultGroup({
  enable,
  groupFieldName
}: StoredDefaultGroupParams) {
  const { initialValues, setFieldValue } = useFormikContext<any>();

  const [storedDefaultGroup, setStoredDefaultGroup] = useLocalStorage<
    string | null | undefined
  >(DEFAULT_GROUP_STORAGE_KEY);

  useEffect(() => {
    // Set the default group value when there is no existing value:
    const existingValue = _.get(initialValues, groupFieldName);
    if (enable && typeof existingValue === "undefined" && storedDefaultGroup) {
      setFieldValue(groupFieldName, storedDefaultGroup);
    }
  }, []);

  return {
    setStoredDefaultGroupIfEnabled: enable ? setStoredDefaultGroup : _.noop
  };
}
