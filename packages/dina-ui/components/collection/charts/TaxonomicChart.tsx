import { useEffect, useState } from "react";
import { useApiClient } from "common-ui";
import ReactECharts from "echarts-for-react";
import { Card, CardHeader } from "react-bootstrap";
//import "echarts/theme/inspired";

const getAggregationKey = (aggName: string, obj: any): string | null => {
  if (!obj || typeof obj !== "object") return null;

  const topAggs = obj?.data?.aggregations;
  if (topAggs) {
    if (topAggs[aggName]) return aggName;
    if (topAggs[`sterms#${aggName}`]) return `sterms#${aggName}`;

    for (const key of Object.keys(topAggs)) {
      if (key.endsWith(aggName)) return key;
    }
    return null;
  }

  if (obj[aggName]) return aggName;
  if (obj[`sterms#${aggName}`]) return `sterms#${aggName}`;

  for (const key of Object.keys(obj)) {
    if (key.endsWith(aggName)) return key;
  }

  return null;
};

function convertBucketsToSunburst(
  buckets: any[],
  aggNames: string[],
  depth = 0
) {
  if (!Array.isArray(buckets) || depth >= aggNames.length) return [];

  return buckets.map((bucket) => {
    const aggName = aggNames[depth + 1];
    const nextAggKey = getAggregationKey(aggName, bucket);
    const childrenBuckets = nextAggKey ? bucket[nextAggKey]?.buckets ?? [] : [];

    return {
      name: bucket.key,
      value: bucket.doc_count,
      children: convertBucketsToSunburst(childrenBuckets, aggNames, depth + 1)
    };
  });
}

export default function TaxonomySunburstChart({ query }) {
  const { apiClient } = useApiClient();

  type SourceFilter = "GNA" | "CUSTOM" | "VERBATIM" | "NO_DETERMINATION" | null;

  const [selectedSource, setSelectedSource] = useState<SourceFilter>(null);
  const [chartData, setChartData] = useState([]);

  const TAXON_LEVELS = [
    "by_kingdom",
    "by_phylum",
    "by_class",
    "by_order",
    "by_family",
    "by_genus",
    "by_species"
  ];

  function buildSourceFilter(selectedSource) {
    switch (selectedSource) {
      case "GNA":
        return {
          term: {
            "included.attributes.determination.scientificNameSource.keyword":
              "GNA"
          }
        };

      case "CUSTOM":
        return {
          term: {
            "included.attributes.determination.scientificNameSource.keyword":
              "CUSTOM"
          }
        };

      case "VERBATIM":
        return {
          exists: {
            field: "included.attributes.determination.verbatimScientificName"
          }
        };

      case "NO_DETERMINATION":
        return {
          bool: {
            must_not: {
              exists: {
                field: "included.attributes.determination"
              }
            }
          }
        };

      default:
        return null; // no filter applied
    }
  }

  async function fetchData(selectedSource) {
    try {
      const sourceFilter = buildSourceFilter(selectedSource);

      const response = await apiClient.axios.post(
        "search-api/search-ws/search",
        {
          size: 0,
          query: {
            bool: {
              must: query,
              ...(sourceFilter ? { filter: sourceFilter } : {})
            }
          },
          aggs: {
            by_kingdom: {
              terms: {
                field:
                  "data.attributes.targetOrganismPrimaryClassification.kingdom.keyword",
                size: 100
              },
              aggs: {
                by_phylum: {
                  terms: {
                    field:
                      "data.attributes.targetOrganismPrimaryClassification.phylum.keyword",
                    size: 100
                  },
                  aggs: {
                    by_class: {
                      terms: {
                        field:
                          "data.attributes.targetOrganismPrimaryClassification.class.keyword",
                        size: 100
                      },
                      aggs: {
                        by_order: {
                          terms: {
                            field:
                              "data.attributes.targetOrganismPrimaryClassification.order.keyword",
                            size: 100
                          },
                          aggs: {
                            by_family: {
                              terms: {
                                field:
                                  "data.attributes.targetOrganismPrimaryClassification.family.keyword",
                                size: 10000
                              },
                              aggs: {
                                by_genus: {
                                  terms: {
                                    field:
                                      "data.attributes.targetOrganismPrimaryClassification.genus.keyword",
                                    size: 10000
                                  },
                                  aggs: {
                                    by_species: {
                                      terms: {
                                        field:
                                          "data.attributes.targetOrganismPrimaryScientificName.keyword",
                                        size: 10000
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
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

      const aggKey = getAggregationKey("by_kingdom", response);
      if (!aggKey) return null;
      const buckets = response.data.aggregations[aggKey]?.buckets ?? [];

      const hierarchy = convertBucketsToSunburst(buckets, TAXON_LEVELS);

      setChartData(hierarchy);
    } catch (err) {
      console.error("Error fetching taxonomy data:", err);
      setChartData([]);
    }
  }

  useEffect(() => {
    fetchData(selectedSource);
  }, [query, apiClient, selectedSource]);

  const TAXON_LABELS = [
    "Kingdom",
    "Phylum",
    "Class",
    "Order",
    "Family",
    "Genus",
    "Species"
  ];

  const graphOptions = {
    sunburst: {
      tooltip: {
        trigger: "item",
        padding: 4,
        borderWidth: 2,
        formatter: function (info) {
          const pathLen = info.treePathInfo ? info.treePathInfo.length : 0;
          const color = info.color;

          const depth = pathLen - 1;
          if (depth === 0) {
            return "";
          }
          const labelIndex = depth - 1;
          return `
          <div style="background:${color};
          padding:6px 8px;
          border-radius:4px;
          font-family:Arial;">
            <strong style="color:#333; font-size:14px;">
              ${TAXON_LABELS[labelIndex]} : ${info.name}
            </strong><br/>
            <span style="color:#333; font-size:12px;">
              Value: ${info.value}
            </span>
          </div>
        `;
        }
      },
      series: [
        {
          type: "sunburst",
          radius: [0, "95%"],
          sort: undefined,
          emphasis: { focus: "ancestor" },
          data: chartData,
          label: {
            rotate: "tangential",
            minAngle: 6,
            overflow: "truncate",
            ellipsis: "..."
          },
          labelLayout: {
            hideOverlap: true
          }
        }
      ]
    },
    treemap: {
      series: [
        {
          type: "treemap",
          roam: true,
          nodeClick: "zoomToNode",
          breadcrumb: { show: true },
          data: chartData
        }
      ]
    }
  };

  const [chartType, setChartType] = useState("sunburst");

  return chartData.length ? (
    <div>
      <strong>Taxonomic Chart (Structured Entries Only)</strong>
      <Card>
        <CardHeader
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between"
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "6px"
            }}
          >
            <p>Select a determination type:</p>
            <select
              value={selectedSource ?? ""}
              onChange={(e) =>
                setSelectedSource((e.target.value || null) as SourceFilter)
              }
            >
              <option value="">All</option>
              <option value="GNA">Structured</option>
              <option value="CUSTOM">Structured Manual</option>
            </select>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={() => setChartType("sunburst")}
              style={{
                padding: "6px 12px",
                borderRadius: "6px",
                border: "1px solid #ccc",
                background: chartType === "sunburst" ? "#007bff" : "#f0f0f0",
                color: chartType === "sunburst" ? "white" : "black",
                cursor: "pointer"
              }}
            >
              Sunburst
            </button>

            <button
              onClick={() => setChartType("treemap")}
              style={{
                padding: "6px 12px",
                borderRadius: "6px",
                border: "1px solid #ccc",
                background: chartType === "treemap" ? "#007bff" : "#f0f0f0",
                color: chartType === "treemap" ? "white" : "black",
                cursor: "pointer"
              }}
            >
              Treemap
            </button>
          </div>
        </CardHeader>
        <ReactECharts
          option={graphOptions[chartType]}
          //theme="inspired"
          style={{ height: "700px", width: "100%" }}
        />
      </Card>
    </div>
  ) : null;
}
