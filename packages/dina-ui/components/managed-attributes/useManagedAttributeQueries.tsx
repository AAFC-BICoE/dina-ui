import useSWR from "swr";
import { useApiClient } from "common-ui";
import { ManagedAttribute } from "packages/dina-ui/types/collection-api";

export interface UseBulkGetParams {
  managedAttributeApiPath: string;
  managedAttributeComponent?: string;
  keys: string[];
  disabled?: boolean;
  /** onSuccess callback. */
}

export function useManagedAttributeQueries({
  managedAttributeApiPath,
  managedAttributeComponent,
  keys,
  disabled = false
}: UseBulkGetParams) {
  const { apiClient } = useApiClient();

  const fetchResources = async (keys: string[]) => {
    const paths = keys.map(
      (key) => `${managedAttributeApiPath}/${managedAttributeComponent}.${key}`
    );

    const headers = {
      Accept: "application/vnd.api+json",
      "Content-Type": "application/vnd.api+json",
      "Crnk-Compact": "true"
    };

    const results = await Promise.all(
      paths.map((url) =>
        apiClient.get<ManagedAttribute>(url, { header: headers })
      )
    );

    return results.map((result) => result.data);
  };

  const shouldFetch = keys?.length > 0 && !disabled;

  const { data: fetchResponse, isValidating } = useSWR(
    shouldFetch ? keys : null,
    () => fetchResources(keys),
    {
      revalidateOnFocus: false
    }
  );

  const dataWithNullForMissing = fetchResponse;

  return { dataWithNullForMissing, loading: isValidating };
}
