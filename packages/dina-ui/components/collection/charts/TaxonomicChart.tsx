import { useEffect, useState, useRef, useMemo } from "react";
import { useApiClient } from "common-ui";
import ReactECharts from "echarts-for-react";
//import { UncontrolledTreeEnvironment, Tree, StaticTreeDataProvider, TreeItem } from 'react-complex-tree';
import { Card, CardHeader } from "react-bootstrap";
//import "echarts/theme/inspired";
import { useMessage } from "../context/MessageContext";

const TAXON_LEVELS = [
  "by_kingdom",
  "by_phylum",
  "by_class",
  "by_order",
  "by_family",
  "by_genus",
  "by_species"
];

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

    const children = convertBucketsToSunburst(
      childrenBuckets,
      aggNames,
      depth + 1
    );

    return {
      id: bucket.key,
      name: bucket.key,
      value: bucket.doc_count,
      children: Array.isArray(children) ? children : []
    };
  });
}

export default function TaxonomySunburstChart({ query }) {
  const { apiClient } = useApiClient();
  const { message } = useMessage();
  const chartRef = useRef<any>(null);
  const [chartType, setChartType] = useState("sunburst");

  type SourceFilter = "GNA" | "CUSTOM" | "VERBATIM" | "NO_DETERMINATION" | null;

  const [selectedSource, setSelectedSource] = useState<SourceFilter>(null);
  const [chartData, setChartData] = useState([]);
  const [chartReady, setChartReady] = useState(false);
  //const [treeItems, setTreeItems] = useState<Record<string, TreeItem> | null>(null);

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

  const TAXON_LABELS = [
    "Kingdom",
    "Phylum",
    "Class",
    "Order",
    "Family",
    "Genus",
    "Species"
  ];

  function getLevelOption() {
    return [
      {
        itemStyle: {
          borderColor: "#666",
          borderWidth: 0,
          gapWidth: 1
        },
        upperLabel: { show: false }
      },

      {
        colorSaturation: [0.25, 0.35],
        itemStyle: {
          borderColor: "#444",
          borderWidth: 4,
          gapWidth: 1
        },
        emphasis: {
          itemStyle: { borderColor: "#ccc" }
        }
      },

      {
        colorSaturation: [0.25, 0.35],
        itemStyle: {
          borderWidth: 4,
          gapWidth: 1,
          borderColorSaturation: 0.25
        }
      },

      {
        colorSaturation: [0.35, 0.45],
        itemStyle: {
          borderWidth: 4,
          gapWidth: 1,
          borderColorSaturation: 0.35
        }
      },

      {
        colorSaturation: [0.45, 0.55],
        itemStyle: {
          borderWidth: 4,
          gapWidth: 1,
          borderColorSaturation: 0.4
        }
      },

      {
        colorSaturation: [0.55, 0.65],
        itemStyle: {
          borderWidth: 4,
          gapWidth: 1,
          borderColorSaturation: 0.5
        }
      },

      {
        colorSaturation: [0.65, 0.75],
        itemStyle: {
          borderWidth: 3,
          gapWidth: 1,
          borderColorSaturation: 0.6
        }
      }
    ];
  }

  const graphOptions = useMemo(() => {
    const sunburstOption = {
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
    };
    const treemapOption = {
      tooltip: {
        trigger: "item",
        padding: 4,
        borderWidth: 2,
        formatter: function (info) {
          const pathLen = info.treePathInfo ? info.treePathInfo.length : 0;
          const depth = pathLen - 1;

          if (depth === 0) return "";

          const labelIndex = depth - 1;
          const label = TAXON_LABELS[labelIndex] || "";

          return `
            <div style="background:#fff;
            padding:6px 8px;
            border-radius:4px;
            font-family:Arial;">
              <strong style="color:#333; font-size:14px;">
                ${label} : ${info.name}
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
          name: "ALL",
          type: "treemap",
          roam: true,
          breadcrumb: { show: true },
          initialTreeDepth: -1,
          leafDepth: null,

          upperLabel: {
            show: true,
            position: "insideTopLeft",
            height: 22,
            fontSize: 12
          },
          itemStyle: {
            borderColor: "#fff"
          },
          levels: getLevelOption(),

          data: chartData
        }
      ]
    };
    return {
      sunburst: sunburstOption,
      treemap: treemapOption
    };
  }, [chartData]);

  const dataReady = graphOptions?.[chartType]?.series?.[0]?.data?.length > 0;

  const option = useMemo(() => {
    if (!dataReady) return { series: [] };
    return graphOptions[chartType];
  }, [chartType, dataReady, graphOptions]);

  useEffect(() => {
    if (!chartReady) return;
    if (!chartRef.current) return;
    if (!message) return;

    const echartsInstance = chartRef.current;
    if (!echartsInstance) return;

    const id = setTimeout(() => {
      if (chartType === "sunburst") {
        echartsInstance.dispatchAction({
          type: "sunburstRootToNode",
          seriesIndex: 0,
          targetNodeId: message
        });
      }
      if (chartType === "treemap") {
        const series = echartsInstance.getModel().getSeriesByIndex(0);
        const tree = series.getData().tree;
        const node = tree.getNodeById(message);

        if (!node) return;

        const isLeaf = !node.children || node.children.length === 0;

        if (isLeaf) {
          echartsInstance.dispatchAction({
            type: "highlight",
            seriesIndex: 0,
            dataIndex: node.dataIndex
          });
          return;
        }

        echartsInstance.dispatchAction({
          type: "treemapRootToNode",
          seriesIndex: 0,
          targetNodeId: message
        });
      }
    }, 100);

    return () => clearTimeout(id);
  }, [message, chartReady, chartType]);

  const onChartReady = (instance: any) => {
    chartRef.current = instance;
    setChartReady(true);

    instance.off("click"); //avoid duplicate handlers
    instance.on("click", (params: any) => {
      if (!params || typeof params !== "object") return;

      const isBreadcrumb =
        params.targetType === "breadcrumb" ||
        (Array.isArray(params.treePathInfo) && !params.data);

      if (isBreadcrumb) {
        return;
      }

      const node = params.data;
      if (!node) return;

      instance.dispatchAction({
        type: "treemapRootToNode",
        seriesIndex: 0,
        targetNodeId: node.id
      });
    });
  };

  useEffect(() => {
    fetchData(selectedSource);
  }, [selectedSource]);

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
              type="button"
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
              type="button"
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
          option={option}
          //theme="inspired"
          style={{ height: "800px", width: "100%" }}
          ref={chartRef}
          onChartReady={onChartReady}
          notMerge={false}
          lazyUpdate={true}
        />
      </Card>
    </div>
  ) : null;
}
