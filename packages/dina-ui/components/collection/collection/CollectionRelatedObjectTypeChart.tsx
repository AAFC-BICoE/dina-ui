import { useEffect, useState } from "react";
import { useApiClient } from "common-ui";
import ReactECharts from "echarts-for-react";

export interface CollectionRelatedObjectTypeChartProps {
  id?: string;
  query?: any;
}

function ChartTypeSelector({ value, onChange }) {
  const items = [
    {
      chartType: "BAR",
      message: "bar"
    },
    {
      chartType: "PIE",
      message: "pie"
    }
  ];

  return (
    <div className="list-layout-selector list-inline">
      {items.map(({ message, chartType }) => (
        <div className="list-inline-item" key={chartType}>
          <label>
            <input
              type="radio"
              checked={value === chartType}
              onChange={() => onChange(chartType)}
            />
            {message}
          </label>
        </div>
      ))}
    </div>
  );
}

export default function CollectionRelatedObjectTypeChart({
  id,
  query
}: CollectionRelatedObjectTypeChartProps) {
  const { apiClient } = useApiClient();
  const [chartType, setChartType] = useState("PIE");

  const fetchData = async () => {
    // Get the Material Sample IDs that have attachments in this collection

    const sampleResponse = await apiClient.axios.post(
      "search-api/search-ws/search",
      {
        _source: { includes: ["data.relationships"] },
        query:
          query ??
          (id
            ? {
                bool: {
                  must: [
                    { term: { "data.relationships.collection.data.id": id } }
                  ]
                }
              }
            : undefined)
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
      const buckets = metadataResponse.data.aggregations[aggKey]?.buckets ?? [];

      setChartData(buckets.map((b) => ({ name: b.key, value: b.doc_count })));
    }
  };

  const [chartData, setChartData] = useState<{ name: string; value: number }[]>(
    []
  );

  useEffect(() => {
    fetchData();
  }, [id, query]);

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
        data: chartData.map((d) => d.value)
      }
    ]
  };

  const pieOptions = {
    tooltip: {
      trigger: "item",
      formatter: "{b}: {c} ({d}%)"
    },
    legend: {
      orient: "horizontal",
      left: "left"
    },
    series: [
      {
        name: "Related Object Count",
        type: "pie",
        data: chartData,

        label: {
          formatter: "{b}: {c} ({d}%)"
        }
      }
    ]
  };

  return chartData.length != 0 ? (
    <div>
      <div>
        <strong>Related Object Types</strong>
        <ChartTypeSelector value={chartType} onChange={setChartType} />
      </div>
      <ReactECharts
        option={chartType === "PIE" ? pieOptions : options}
        style={{ height: "400px" }}
        notMerge={true}
      />
    </div>
  ) : null;
}
