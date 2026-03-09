import { useEffect, useState } from "react";
import { useApiClient } from "common-ui";
import ReactECharts from "echarts-for-react";

interface CollectionProjectNameChartProps {
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

export default function SampleCollectionChart({
  query
}: CollectionProjectNameChartProps) {
  const { apiClient } = useApiClient();
  const [chartType, setChartType] = useState("PIE");

  const fetchData = async () => {
    const response = await apiClient.axios.post(
      "search-api/search-ws/search",
      {
        size: 0,
        query: query ?? undefined,
        aggs: {
          collection_nested: {
            nested: {
              path: "included"
            },
            aggs: {
              only_collection: {
                filter: {
                  bool: {
                    must: [
                      {
                        term: {
                          "included.type": "collection"
                        }
                      }
                    ]
                  }
                },
                aggs: {
                  project_name: {
                    terms: {
                      field: "included.attributes.name.keyword",
                      missing: "NO_COLLECTION",
                      size: 100,
                      order: {
                        _count: "desc"
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      { params: { indexName: "dina_material_sample_index" } }
    );

    if (response.data.aggregations) {
      const buckets =
        response.data.aggregations["nested#collection_nested"]?.[
          "filter#only_collection"
        ]?.["sterms#project_name"].buckets ?? [];

      setChartData(buckets.map((b) => ({ name: b.key, value: b.doc_count })));
    }
  };

  const [chartData, setChartData] = useState<{ name: string; value: number }[]>(
    []
  );

  useEffect(() => {
    fetchData();
  }, [query]);

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
        data: chartData.filter((d) => d.value > 0),

        label: {
          formatter: "{b}: {c} ({d}%)"
        }
      }
    ]
  };

  return chartData.length != 0 ? (
    <div>
      <strong>Sample Count By Collection</strong>
      <ChartTypeSelector value={chartType} onChange={setChartType} />
      <ReactECharts
        option={chartType === "PIE" ? pieOptions : options}
        style={{ height: "400px", width: "100%" }}
        notMerge={true}
      />
    </div>
  ) : null;
}
