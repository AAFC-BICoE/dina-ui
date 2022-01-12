import { useApiClient } from "..";

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
          name: fieldNameLabel,
          label: fieldNameLabel,
          type: resp.data?.[key]
        });
      });
  }

  fetchQueryFieldsByIndex("dina_material_sample_index");
  return <></>;
}
