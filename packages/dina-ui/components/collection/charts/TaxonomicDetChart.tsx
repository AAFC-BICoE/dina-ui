import { useEffect, useState } from "react";
import { useApiClient } from "common-ui";
import ReactECharts from "echarts-for-react";
import { Card } from "react-bootstrap";

interface TaxonomicDetChartProps {
  query?: any;
}

export default function TaxonomicDetChart({ query }: TaxonomicDetChartProps) {
  const { apiClient } = useApiClient();
  const [chartData, setChartData] = useState<{ name: string; value: number }[]>(
    []
  );

  async function fetchData() {
    try {
      const response = await apiClient.axios.post(
        "search-api/search-ws/search",
        {
          size: 0,
          query,
          aggs: {
            scientific_source_count: {
              filters: {
                filters: {
                  source_struct: {
                    term: {
                      "included.attributes.determination.scientificNameSource.keyword":
                        "GNA"
                    }
                  },
                  source_manual: {
                    term: {
                      "included.attributes.determination.scientificNameSource.keyword":
                        "CUSTOM"
                    }
                  },
                  source_verb: {
                    exists: {
                      field:
                        "included.attributes.determination.verbatimScientificName"
                    }
                  }
                }
              }
            },
            no_determination: {
              filter: {
                bool: {
                  must_not: {
                    exists: {
                      field: "included.attributes.determination"
                    }
                  }
                }
              }
            }
          }
        },
        { params: { indexName: "dina_material_sample_index" } }
      );

      const aggs = response.data?.aggregations;

      if (!aggs) {
        setChartData([]);
        return;
      }

      const sciAgg = aggs["filters#scientific_source_count"]?.buckets ?? {};
      const noDetCount = aggs["filter#no_determination"]?.doc_count ?? 0;

      const formatted = [
        { name: "Structured", value: sciAgg.source_struct?.doc_count ?? 0 },
        {
          name: "Structured Manual",
          value: sciAgg.source_manual?.doc_count ?? 0
        },
        { name: "Verbatim", value: sciAgg.source_verb?.doc_count ?? 0 },
        { name: "No Determination", value: noDetCount }
      ];

      setChartData(formatted);
    } catch (error) {
      console.error("Error fetching determination data:", error);
      setChartData([]);
    }
  }

  useEffect(() => {
    fetchData();
  }, [query, apiClient]);

  const options = {
    tooltip: {
      trigger: "item",
      formatter: "{b}: {c} ({d}%)"
    },
    legend: {
      orient: "horizontal",
      bottom: 0
    },
    series: [
      {
        name: "Determinations",
        type: "pie",
        radius: "65%",
        center: ["50%", "55%"],
        data: chartData,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: "rgba(0, 0, 0, 0.5)"
          }
        }
      }
    ]
  };

  const hasData = chartData.some((item) => item.value > 0);

  return hasData ? (
    <div>
      <strong>Taxonomic Determinations</strong>
      <Card>
        <ReactECharts
          option={options}
          style={{ height: "400px", width: "100%" }}
        />
      </Card>
    </div>
  ) : null;
}
