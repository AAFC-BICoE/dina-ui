import { useEffect, useState } from "react";
import { useApiClient } from "common-ui";
import EBarChart from "./EBarChart";

export default function CollectionSampleTypeChart({ id }: { id: string }) {
  const { apiClient } = useApiClient();
  const query = {
    size: 0,
    query: {
      bool: {
        must: [{ term: { "data.relationships.collection.data.id": id } }]
      }
    },
    aggs: {
      by_sample_type: {
        terms: {
          field: "data.attributes.materialSampleType.keyword",
          size: 10,
          missing: "NO_TYPE",
          order: { _count: "desc" }
        }
      }
    }
  };

  // Helper function to get aggregation key format
  const getAggregationKey = (aggName: string, response: any): string => {
    if (response.aggregations[aggName]) {
      return aggName;
    }
    if (response.aggregations[`sterms#${aggName}`]) {
      return `sterms#${aggName}`;
    }

    for (const key of Object.keys(response.aggregations)) {
      if (key.endsWith(aggName)) {
        return key;
      }
    }

    return aggName;
  };
  const dataMap: Record<string, number> = {
    WHOLE_ORGANISM: 0,
    MIXED_ORGANISMS: 0,
    CULTURE_STRAIN: 0,
    ORGANISM_PART: 0,
    MOLECULAR_SAMPLE: 0,
    NO_TYPE: 0
  };

  const fetchData = async () => {
    const response = await apiClient.axios.post(
      "search-api/search-ws/search",
      query,
      { params: { indexName: "dina_material_sample_index" } }
    );

    if (response.data.aggregations) {
      const aggKey = getAggregationKey("by_sample_type", response.data);
      const buckets = response.data.aggregations[aggKey]?.buckets ?? [];
      buckets.map((b) => (dataMap[b.key] = b.doc_count));

      setChartData(
        Object.entries(dataMap).map(([name, value]) => ({ name, value }))
      );
    }
  };

  const [chartData, setChartData] = useState<{ name: string; value: number }[]>(
    []
  );

  useEffect(() => {
    fetchData();
  }, [id]);

  return (
    <EBarChart data={chartData} titleId="collectionSampleTypeChartTitle" />
  );
}
