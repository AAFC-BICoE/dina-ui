import { useEffect, useState } from "react";
import { useApiClient } from "common-ui";
import ReactECharts from "echarts-for-react";
import { DinaMessage } from "packages/dina-ui/intl/dina-ui-intl";
import { Card } from "react-bootstrap";
interface RelatedObjectTypeChart {
  query?: any;
}

export default function RelatedObjectTypeChart({
  query
}: RelatedObjectTypeChart) {
  const { apiClient } = useApiClient();

  async function fetchData() {
    try {
      // Get the Material Sample IDs that have attachments in this collection
      const sampleResponse = await apiClient.axios.post(
        "search-api/search-ws/search",
        {
          _source: { includes: ["data.relationships"] },
          query
        },
        { params: { indexName: "dina_material_sample_index" } }
      );

      // Extract and flatten the attachment IDs
      const attachmentIds = sampleResponse.data.hits.hits
        .flatMap(
          (hit) =>
            hit._source?.data?.relationships?.attachment?.data?.map(
              (a) => a.id
            ) ?? []
        )
        .filter((id) => !!id);

      if (attachmentIds.length === 0) {
        setChartData([]);
        return;
      }

      // Query the Metadata index using those IDs
      const metadataResponse = await apiClient.axios.post(
        "search-api/search-ws/search",
        {
          query: {
            terms: { "data.id": attachmentIds }
          },
          aggs: {
            by_file_extension: {
              terms: {
                field: "data.attributes.fileExtension",
                size: 1000,
                order: { _count: "desc" },
                missing: "NO_FILE_EXTENSION"
              }
            }
          }
        },
        { params: { indexName: "dina_object_store_index" } }
      );

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

      // Process aggregations
      if (metadataResponse.data.aggregations) {
        const aggKey = getAggregationKey(
          "by_file_extension",
          metadataResponse.data
        );
        const buckets =
          metadataResponse.data.aggregations[aggKey]?.buckets ?? [];

        setChartData(buckets.map((b) => ({ name: b.key, value: b.doc_count })));
      }
    } catch (error: any) {
      console.error("Error fetching related object type data:", error);
      setChartData([]);
    }
  }

  const [chartData, setChartData] = useState<{ name: string; value: number }[]>(
    []
  );

  useEffect(() => {
    fetchData();
  }, [query, apiClient]);

  const options = {
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "shadow"
      }
    },
    xAxis: {
      type: "category",
      data: chartData.map((d) => d.name),
      axisLabel: {
        interval: 0,
        rotate: 45,
        overflow: "break",
        width: 80,
        hideOverlap: false
      }
    },
    yAxis: {
      type: "value",
      minInterval: 1
    },
    series: [
      {
        name: "Related Object Count",
        type: "bar",
        data: chartData.map((d) => d.value),
        itemStyle: {
          color: "#5470c6"
        }
      }
    ]
  };

  return chartData.length != 0 ? (
    <div>
      <div>
        <strong>
          <DinaMessage id="collectionRelatedObjectTypeChartTitle" />
        </strong>
      </div>
      <Card>
        <ReactECharts
          option={options}
          style={{ height: "400px", width: "100%" }}
        />
      </Card>
    </div>
  ) : null;
}
