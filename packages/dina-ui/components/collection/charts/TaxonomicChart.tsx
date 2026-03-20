import { useEffect, useState } from "react";
import { useApiClient } from "common-ui";
import ReactECharts from "echarts-for-react";
import { Card } from "react-bootstrap";

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

  async function fetchData() {
    try {
      const response = await apiClient.axios.post(
        "search-api/search-ws/search",
        {
          size: 0,
          query,
          aggs: {
            by_kingdom: {
              terms: {
                field:
                  "data.attributes.targetOrganismPrimaryClassification.kingdom.keyword",
                size: 100,
                missing: "NO_KINGDOM"
              },
              aggs: {
                by_phylum: {
                  terms: {
                    field:
                      "data.attributes.targetOrganismPrimaryClassification.phylum.keyword",
                    size: 100,
                    missing: "NO_PHYLUM"
                  },
                  aggs: {
                    by_class: {
                      terms: {
                        field:
                          "data.attributes.targetOrganismPrimaryClassification.class.keyword",
                        size: 100,
                        missing: "NO_CLASS"
                      },
                      aggs: {
                        by_order: {
                          terms: {
                            field:
                              "data.attributes.targetOrganismPrimaryClassification.order.keyword",
                            size: 100,
                            missing: "NO_ORDER"
                          },
                          aggs: {
                            by_family: {
                              terms: {
                                field:
                                  "data.attributes.targetOrganismPrimaryClassification.family.keyword",
                                size: 10000,
                                missing: "NO_FAMILY"
                              },
                              aggs: {
                                by_genus: {
                                  terms: {
                                    field:
                                      "data.attributes.targetOrganismPrimaryClassification.genus.keyword",
                                    size: 10000,
                                    missing: "NO_GENUS"
                                  },
                                  aggs: {
                                    by_species: {
                                      terms: {
                                        field:
                                          "data.attributes.targetOrganismPrimaryScientificName.keyword",
                                        size: 10000,
                                        missing: "NO_SPECIES"
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
    fetchData();
  }, [query, apiClient]);

  const TAXON_LABELS = [
    "Kingdom",
    "Phylum",
    "Class",
    "Order",
    "Family",
    "Genus",
    "Species"
  ];

  const options = {
    tooltip: {
      trigger: "item",
      formatter: function (info) {
        const pathLen = info.treePathInfo ? info.treePathInfo.length : 0;

        const depth = pathLen - 1;
        if (depth === 0) {
          return "";
        }
        const labelIndex = depth - 1;
        return `
        <strong>${TAXON_LABELS[labelIndex]} : ${info.name}</strong><br/>
        Value: ${info.value}
      `;
      }
    },
    series: [
      {
        type: "sunburst",
        radius: [0, "95%"],
        sort: undefined,
        emphasis: { focus: "ancestor" },
        data: chartData
      }
    ]
  };

  return chartData.length ? (
    <div>
      <strong>Taxonomic Chart</strong>
      <Card>
        <ReactECharts
          option={options}
          style={{ height: "700px", width: "100%" }}
        />
      </Card>
    </div>
  ) : null;
}
