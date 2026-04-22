import { useCallback, useState } from "react";
import useSWR from "swr";
import { ApiConfigInfo, ApiModule } from "../../types/system-info/SystemInfo";
import { ApiInfo } from "../../types/system-info/ApiInfo";
import { useApiClient } from "common-ui";

export function useSystemInfoCheck(apiConfigs: ApiConfigInfo[]) {
  const { apiClient } = useApiClient();
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  const fetchAllModules = useCallback(async (): Promise<ApiModule[]> => {
    const results = await Promise.allSettled(
      apiConfigs.map(async (config): Promise<ApiModule> => {
        try {
          const response = await apiClient.get<ApiInfo>(
            `${config.apiEndpoint}/api-info`,
            {}
          );
          const apiInfo = response.data;
          return {
            apiConfig: config,
            moduleVersion: apiInfo.id,
            status: "online",
            messageProducerEnabled: apiInfo.messageProducer ?? false,
            messageConsumerEnabled: apiInfo.messageConsumer ?? false,
            attentionRequired: apiInfo.attentionRequired,
            moduleInfo: apiInfo.moduleInfo
              ? new Map(Object.entries(apiInfo.moduleInfo))
              : undefined
          };
        } catch (err: any) {
          return {
            apiConfig: config,
            moduleVersion: "unknown",
            status: "offline",
            messageProducerEnabled: false,
            messageConsumerEnabled: false,
            attentionRequired: true,
            errorMessage: err?.message ?? "Unable to reach service."
          };
        }
      })
    );

    // Update the last refresh date.
    setLastRefreshed(new Date());

    return results.map((result, index) =>
      result.status === "fulfilled"
        ? result.value
        : {
            apiConfig: apiConfigs[index],
            moduleVersion: "unknown",
            status: "offline" as const,
            messageProducerEnabled: false,
            messageConsumerEnabled: false,
            attentionRequired: true,
            errorMessage: result.reason?.message ?? "Unexpected error."
          }
    );
  }, [apiClient, apiConfigs]);

  const { data, isValidating, error, mutate } = useSWR(
    "system-info-check",
    fetchAllModules,
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false
    }
  );

  return {
    modules: data ?? [],
    loading: isValidating,
    error,
    lastRefreshed,
    refresh: mutate
  };
}
