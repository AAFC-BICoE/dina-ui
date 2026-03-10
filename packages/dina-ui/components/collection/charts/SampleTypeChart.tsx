import { useEffect, useState } from "react";
import { useApiClient } from "common-ui";
import ReactECharts from "echarts-for-react";
import { DinaMessage } from "../../../intl/dina-ui-intl";
import { Card } from "react-bootstrap";

interface SampleTypeChart {
  query?: any;
}

export default function SampleTypeChart({ query }: SampleTypeChart) {
  const { apiClient } = useApiClient();

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

  async function fetchData() {
    try {
      const response = await apiClient.axios.post(
        "search-api/search-ws/search",
        {
          size: 0,
          query,
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
        },
        { params: { indexName: "dina_material_sample_index" } }
      );

      if (response.data.aggregations) {
        const aggKey = getAggregationKey("by_sample_type", response.data);
        const buckets = response.data.aggregations[aggKey]?.buckets ?? [];
        if (buckets.length != 0) {
          buckets.map((b) => (dataMap[b.key] = b.doc_count));

          setChartData(
            Object.entries(dataMap).map(([name, value]) => ({ name, value }))
          );
        } else {
          // don't add values with 0 entries if bucket is empty
          setChartData([]);
        }
      }
    } catch (error: any) {
      console.error("Error fetching sample type data:", error);
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
      type: "value"
    },
    series: [
      {
        name: "Sample Count",
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
      <strong>
        <DinaMessage id="sampleTypeChartTitle" />
      </strong>
      <Card>
        <ReactECharts
          option={options}
          style={{ height: "400px", width: "100%" }}
        />
      </Card>
    </div>
  ) : null;
}
