import { useEffect, useState } from "react";
import { useApiClient } from "common-ui";
import ReactECharts from "echarts-for-react";
import { DinaMessage } from "../../../intl/dina-ui-intl";
/**
 * Component to display a histogram of sample createdOn date for material samples in that collection.
 * @param id The collection ID for which to display the records added chart.
 */
export default function CollectionRecordsAddedChart({ id }: { id: string }) {
  const { apiClient } = useApiClient();
  const query = {
    size: 0,
    query: {
      bool: {
        must: [{ term: { "data.relationships.collection.data.id": id } }]
      }
    },
    aggs: {
      by_date: {
        date_histogram: {
          field: "data.attributes.createdOn",
          calendar_interval: "month",
          format: "yyyy-MM",
          order: { _key: "asc" }
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

  const fetchData = async () => {
    const response = await apiClient.axios.post(
      "search-api/search-ws/search",
      query,
      { params: { indexName: "dina_material_sample_index" } }
    );

    if (response.data.aggregations) {
      const aggKey = getAggregationKey("by_date", response.data);
      const buckets = response.data.aggregations[aggKey]?.buckets ?? [];

      setChartData(
        buckets.map((b) => ({ name: b.key_as_string, value: b.doc_count }))
      );
    }
  };

  const [chartData, setChartData] = useState<{ name: string; value: number }[]>(
    []
  );

  useEffect(() => {
    fetchData();
  }, [id]);

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
        name: "Sample Count",
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
      <strong>
        <DinaMessage id="collectionRecordAddedChartTitle" />
      </strong>
      <ReactECharts
        option={options}
        style={{ height: "400px", width: "100%" }}
      />
    </div>
  );
}
