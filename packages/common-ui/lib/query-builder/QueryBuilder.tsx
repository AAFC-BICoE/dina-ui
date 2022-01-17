import { useMemo } from "react";
import useSWR from "swr";
import { DinaForm, useApiClient } from "..";
import { QueryRow } from "./QueryRow";
import { v4 as uuidv4 } from "uuid";

export function QueryBuilder() {
  const { apiClient } = useApiClient();

  async function fetchQueryFieldsByIndex(indexName) {
    const resp = await apiClient.axios.get("search-api/search/mapping", {
      params: { indexName }
    });

    const result: [{}] = [{}];

    Object.keys(resp.data)
      .filter(key => key.includes("data.attributes."))
      .map(key => {
        const fieldNameLabel = key.substring(
          "data.attributes.".length,
          key.lastIndexOf(".")
        );
        result.push({
          label: fieldNameLabel,
          value: fieldNameLabel,
          type: resp.data?.[key]
        });
      });

    return result;
  }

  // Invalidate the query cache on query change, don't use SWR's built-in cache:
  const cacheId = useMemo(() => uuidv4(), []);

  const {
    data,
    error,
    isValidating: loading
  } = useSWR(["dina_material_sample_index", cacheId], fetchQueryFieldsByIndex, {
    shouldRetryOnError: true,
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  });

  if (loading || error) return <></>;

  return (
    <DinaForm initialValues={{}}>
      <QueryRow queryRowProps={data} />
    </DinaForm>
  );
}
