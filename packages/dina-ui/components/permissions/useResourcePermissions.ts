import { useAccount, useApiClient } from "common-ui";
import { useEffect, useState } from "react";
import type { PermissionCheckResponse } from "../../types/user-api";

export interface UseResourcePermissionsParams {
  /** API whose permission-check endpoint is used, e.g. "/collection-api". */
  apiBaseUrl: string;

  /** JSON:API type of the resource, e.g. "controlled-vocabulary-item". */
  typeName: string;

  /** Attribute the API's permission-check reads the group from ("group" unless the API says otherwise). */
  groupAttribute?: string;

  /** Only check this group, e.g. the group of the record being viewed. Defaults to all of the user's groups. */
  group?: string;
}

export interface ResourcePermissions {
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  loading: boolean;
}

const LOADING_PERMISSIONS: ResourcePermissions = {
  canCreate: false,
  canEdit: false,
  canDelete: false,
  loading: true
};

const ALL_ALLOWED: ResourcePermissions = {
  canCreate: true,
  canEdit: true,
  canDelete: true,
  loading: false
};

/**
 * What the user may do with a resource type, using the API's permission-check endpoint.
 * Permissions depend on the group, so each one is true when granted in the given group, or in any
 * of the user's groups when no group is given.
 * Everything is denied while loading, so buttons stay hidden until the check completes.
 */
export function useResourcePermissions({
  apiBaseUrl,
  typeName,
  groupAttribute = "group",
  group
}: UseResourcePermissionsParams): ResourcePermissions {
  const { apiClient } = useApiClient();
  const { isAdmin, groupNames } = useAccount();
  const [permissions, setPermissions] = useState(LOADING_PERMISSIONS);
  const groupsToCheck = group === undefined ? groupNames ?? [] : [group];
  const groupKey = groupsToCheck.join(",");

  useEffect(() => {
    if (isAdmin) {
      setPermissions(ALL_ALLOWED);
      return;
    }
    let cancelled = false;
    setPermissions(LOADING_PERMISSIONS);
    (async () => {
      try {
        const results = await Promise.all(
          groupsToCheck.map((groupToCheck) =>
            apiClient.axios.post<PermissionCheckResponse>(
              `${apiBaseUrl}/permission-check`,
              {
                data: {
                  type: typeName,
                  attributes: { [groupAttribute]: groupToCheck }
                }
              }
            )
          )
        );
        const granted = results.flatMap(
          ({ data }) => data?.data?.attributes?.permissions ?? []
        );
        if (!cancelled) {
          setPermissions({
            canCreate: granted.includes("create"),
            canEdit: granted.includes("update"),
            canDelete: granted.includes("delete"),
            loading: false
          });
        }
      } catch (e) {
        // If there is a failure in the permission check, assume all permissions are allowed to
        // avoid hiding buttons unnecessarily. The API will still enforce permissions on it's own.
        console.warn(e);
        if (!cancelled) {
          setPermissions(ALL_ALLOWED);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [apiBaseUrl, typeName, groupAttribute, isAdmin, groupKey]);

  return permissions;
}
