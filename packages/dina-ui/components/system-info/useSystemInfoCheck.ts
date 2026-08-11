import { useCallback, useState } from "react";
import useSWR from "swr";
import { ApiConfigInfo, ApiModule } from "../../types/system-info/SystemInfo";
import { ApiInfo } from "../../types/system-info/ApiInfo";
import { useAccount, useApiClient } from "common-ui";
import { useDinaIntl } from "../../intl/dina-ui-intl";

export function useSystemInfoCheck(apiConfigs: ApiConfigInfo[]) {
  const { apiClient } = useApiClient();
  const { isAdmin } = useAccount();
  const { formatMessage } = useDinaIntl();
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  const fetchAllModules = useCallback(async (): Promise<ApiModule[]> => {
    const results = await Promise.allSettled(
      apiConfigs.map(async (config): Promise<ApiModule> => {
        // measure how long the api-info request takes, even when it fails
        const startTime = performance.now();
        try {
          const response = await apiClient.get<ApiInfo>(
            `${config.apiEndpoint}/api-info`,
            {}
          );
          const latencyMs = Math.round(performance.now() - startTime);
          const apiInfo = response.data;
          return {
            apiConfig: config,
            moduleVersion: apiInfo.id,
            status: "online",
            latencyMs,
            messageProducerEnabled: apiInfo.messageProducer ?? false,
            messageConsumerEnabled: apiInfo.messageConsumer ?? false,
            attentionRequired: apiInfo.attentionRequired,
            moduleInfo: apiInfo.moduleInfo
              ? new Map(Object.entries(apiInfo.moduleInfo))
              : undefined
          };
        } catch (err: any) {
          const latencyMs = Math.round(performance.now() - startTime);
          return {
            apiConfig: config,
            status: "offline",
            latencyMs,
            messageProducerEnabled: undefined,
            messageConsumerEnabled: undefined,
            attentionRequired: true,
            errorMessage:
              err?.cause?.data?.error ??
              err?.message ??
              formatMessage("systemInfoUnableToReachService"),
            errorStatus: err?.cause?.status,
            errorStatusText: err?.cause?.data?.path
              ? `${err.cause.data.path}`
              : err?.cause?.statusText
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
            status: "offline" as const,
            messageProducerEnabled: false,
            messageConsumerEnabled: false,
            attentionRequired: true,
            errorMessage:
              result.reason?.message ?? formatMessage("systemInfoUnexpectedError")
          }
    );
  }, [apiClient, apiConfigs, formatMessage]);

  const { data, isValidating, error, mutate } = useSWR(
    // The system info page is admin-only, so don't request anything for non-admin users
    isAdmin ? "system-info-check" : null,
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
