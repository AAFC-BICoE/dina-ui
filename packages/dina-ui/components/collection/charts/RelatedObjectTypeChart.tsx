import { useEffect, useState } from "react";
import { useApiClient } from "common-ui";
import ReactECharts from "echarts-for-react";
import { DinaMessage } from "../../../intl/dina-ui-intl";
import { Card } from "react-bootstrap";

/**
 * Elasticsearch's default cap on IDs in a terms query (index.max_terms_count). At most this many
 * distinct attachments are counted, page with a composite aggregation if a query ever matches more.
 */
const MAX_TERMS = 65536;

interface RelatedObjectTypeChart {
  query?: any;
}

export default function RelatedObjectTypeChart({
  query
}: RelatedObjectTypeChart) {
  const { apiClient } = useApiClient();

  async function fetchData() {
    try {
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

      // Get the distinct attachment IDs of all the Material Samples matching the query
      const sampleResponse = await apiClient.axios.post(
        "search-api/search-ws/search",
        {
          size: 0,
          query,
          aggs: {
            attachment_ids: {
              terms: {
                field: "data.relationships.attachment.data.id",
                size: MAX_TERMS
              }
            }
          }
        },
        { params: { indexName: "dina_material_sample_index" } }
      );

      const attachmentIds = sampleResponse.data.aggregations
        ? (
            sampleResponse.data.aggregations[
              getAggregationKey("attachment_ids", sampleResponse.data)
            ]?.buckets ?? []
          ).map((b) => b.key)
        : [];

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

  return (
    <div>
      <div>
        <strong>
          <DinaMessage id="relatedObjectTypeChartTitle" />
        </strong>
      </div>
      <Card>
        {chartData.length > 0 ? (
          <ReactECharts
            option={options}
            style={{ height: "400px", width: "100%" }}
          />
        ) : (
          <div
            style={{
              height: "400px",
              justifyContent: "center",
              alignItems: "center",
              display: "flex",
              color: "#999",
              fontSize: 18
            }}
          >
            <DinaMessage id="noData" />
          </div>
        )}
      </Card>
    </div>
  );
}
