import { useState, useEffect } from "react";
import { useApiClient } from "common-ui";
import type { ResourcePermission } from "./PermissionsTable";
import type { PermissionCheckResponse } from "../../types/user-api";

//Maps each permission-table row to the backend service
const RESOURCE_CHECK_CONFIG: {
  resourceKey: ResourcePermission["resourceKey"];
  servicePath: string;
  jsonApiType: string;
}[] = [
  // Uncomment these when other services have the endpoint implemented

  // {
  //   resourceKey: "resource_materialSample",
  //   servicePath: "collection-api",
  //   jsonApiType: "material-sample"
  // },
  // {
  //   resourceKey: "resource_controlledVocabulary",
  //   servicePath: "collection-api",
  //   jsonApiType: "controlled-vocabulary"
  // },
  // {
  //   resourceKey: "resource_formTemplate",
  //   servicePath: "collection-api",
  //   jsonApiType: "form-template"
  // },
  // {
  //   resourceKey: "resource_objectStore",
  //   servicePath: "objectstore-api",
  //   jsonApiType: "object-store"
  // },
  {
    resourceKey: "resource_agent",
    servicePath: "agent-api",
    jsonApiType: "person"
  }
];

/**
 * Hook that calls the permission-check endpoint on each relevant backend service
 * for the given group, and returns the aggregated table data.
 */
export function usePermissionsCheck(selectedGroup: string): {
  permissionsData: ResourcePermission[] | undefined;
  loading: boolean;
} {
  const { apiClient } = useApiClient();
  const [permissionsData, setPermissionsData] = useState<
    ResourcePermission[] | undefined
  >(undefined);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedGroup) {
      setPermissionsData(undefined);
      return;
    }

    let cancelled = false;
    setLoading(true);

    const checks = RESOURCE_CHECK_CONFIG.map(async (cfg) => {
      try {
        const isAgentApi = cfg.servicePath === "agent-api";
        const response = await apiClient.axios.post<PermissionCheckResponse>(
          `/${cfg.servicePath}/permission-check`,
          {
            data: {
              type: cfg.jsonApiType,
              attributes: isAgentApi ? {} : { group: selectedGroup }
            }
          }
        );

        const perms = response.data?.data?.attributes?.permissions ?? [];

        return {
          resourceKey: cfg.resourceKey,
          read: perms.includes("read"),
          create: perms.includes("create"),
          edit: perms.includes("update"),
          delete: perms.includes("delete")
        } satisfies ResourcePermission;
      } catch {
        // Service not available — fall back to all-denied.
        return {
          resourceKey: cfg.resourceKey,
          read: false,
          create: false,
          edit: false,
          delete: false,
          unavailable: true
        } satisfies ResourcePermission;
      }
    });

    Promise.all(checks).then((resolved) => {
      if (!cancelled) {
        setPermissionsData(resolved);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [selectedGroup]);

  return { permissionsData, loading };
}
