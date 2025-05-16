import React, { useEffect, useState, useRef } from "react";
import * as echarts from "echarts";
import "./TaxonomyTree.css";
import { useApiClient } from "..";
import useVocabularyOptions from "../../../dina-ui/components/collection/useVocabularyOptions";

// Type definitions
interface TreeNode {
  name: string;
  value?: number;
  children?: TreeNode[];
}

interface ElasticsearchResponse {
  aggregations?: {
    [key: string]: {
      buckets: Array<{
        key: string;
        doc_count: number;
        [key: string]: any;
      }>;
    };
  };
}

export default function TaxonomyTree() {
  const [error, setError] = useState<string | null>(null);
  const [taxonomicRanks, setTaxonomicRanks] = useState<string[]>([]);
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);
  const { apiClient } = useApiClient();

  // Retrieve the classification options
  const { loading, vocabOptions: taxonomicRankOptions } = useVocabularyOptions({
    path: "collection-api/vocabulary2/taxonomicRank"
  });

  useEffect(() => {
    // Clean up chart on unmount
    return () => {
      if (chartInstance.current) {
        chartInstance.current.dispose();
      }
    };
  }, []);

  useEffect(() => {
    // Process taxonomic ranks once they're loaded
    if (!loading && taxonomicRankOptions?.length) {
      // Extract rank values from options
      const ranks = taxonomicRankOptions
        .map((option) => option.value.toLowerCase())
        .filter(Boolean);

      if (ranks.length > 0) {
        setTaxonomicRanks(ranks);
        fetchTaxonomyData(ranks);
      } else {
        // Fallback if no ranks found
        const fallbackRanks = [
          "kingdom",
          "phylum",
          "class",
          "order",
          "family",
          "genus"
        ];
        setTaxonomicRanks(fallbackRanks);
        fetchTaxonomyData(fallbackRanks);
      }
    }
  }, [loading, taxonomicRankOptions]);

  const buildAggregationQuery = (ranks: string[]): Record<string, any> => {
    const aggregationQuery: Record<string, any> = {};
    let currentLevel = aggregationQuery;

    ranks.forEach((rank, index) => {
      const aggName = `taxonomy_${rank}`;

      currentLevel[aggName] = {
        terms: {
          field: `data.attributes.targetOrganismPrimaryClassification.${rank}.keyword`,
          size: 10000
        }
      };

      if (index < ranks.length - 1) {
        currentLevel[aggName].aggs = {};
        currentLevel = currentLevel[aggName].aggs;
      }
    });

    return aggregationQuery;
  };

  const fetchTaxonomyData = async (ranks: string[]): Promise<void> => {
    try {
      const aggregations = buildAggregationQuery(ranks);

      const response = await apiClient.axios.post<ElasticsearchResponse>(
        `search-api/search-ws/search`,
        {
          size: 0,
          aggs: aggregations
        },
        {
          params: {
            indexName: "dina_material_sample_index"
          }
        }
      );

      renderChart(response.data.aggregations, ranks);
    } catch (err) {
      console.error("Error fetching taxonomy data:", err);
      setError(err instanceof Error ? err.message : "Error fetching data");
    }
  };

  const renderChart = (
    aggregations: ElasticsearchResponse["aggregations"] | undefined,
    ranks: string[]
  ): void => {
    if (!chartRef.current) return;

    // Process data into a tree structure
    const treeData = processToTreeData(aggregations, ranks);

    // Initialize chart
    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current);
    }

    // Define color scheme for taxonomic levels
    const levelColors = [
      "#5470c6",
      "#91cc75",
      "#fac858",
      "#ee6666",
      "#73c0de",
      "#3ba272"
    ];

    // Set up chart options
    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: "item",
        triggerOn: "mousemove",
        formatter: (params: any) => {
          const { name, value } = params.data;
          if (value) {
            return `<div class="tooltip-content">
                     <strong>${name}</strong><br/>
                     Count: ${value.toLocaleString()}<br/>
                     Rank: ${getRankNameForNode(params.treePathInfo)}
                   </div>`;
          }
          return name;
        }
      },
      series: [
        {
          type: "tree",
          name: "Taxonomy",
          data: [treeData],
          top: "2%",
          left: "7%",
          bottom: "2%",
          right: "20%",
          symbolSize: (value: number) => {
            if (!value) return 7;
            // Scale node size based on log of count
            return Math.max(7, Math.min(25, 5 + Math.log10(value) * 3));
          },
          symbol: "circle",
          itemStyle: {
            color: (params) => {
              const depth = params.treePathInfo
                ? params.treePathInfo.length - 1
                : 0;
              return levelColors[depth % levelColors.length];
            }, // Type assertion to resolve itemStyle.color type issue
            borderWidth: 1,
            borderColor: "#fff"
          } as any,
          label: {
            position: "left",
            verticalAlign: "middle",
            align: "right",
            fontSize: 12,
            fontWeight: "bold",
            distance: 5,
            formatter: (params: any) => {
              const { name, value } = params.data;
              if (value) {
                return `{name|${name}} {count|${value.toLocaleString()}}`;
              }
              return `{name|${name}}`;
            },
            rich: {
              name: {
                fontSize: 12,
                fontWeight: "bold"
              },
              count: {
                fontSize: 10,
                color: "#999",
                padding: [0, 0, 0, 4]
              }
            }
          },
          leaves: {
            label: {
              position: "right",
              verticalAlign: "middle",
              align: "left"
            }
          },
          expandAndCollapse: true,
          animationDuration: 550,
          animationDurationUpdate: 750,
          initialTreeDepth: 2,
          emphasis: {
            focus: "descendant"
          },
          roam: true,
          lineStyle: {
            width: 1.5,
            curveness: 0.5,
            opacity: 0.7
          }
        }
      ],
      toolbox: {
        show: true,
        feature: {
          restore: { show: true, title: "Reset View" },
          saveAsImage: { show: true, title: "Save as Image" },
          dataZoom: {
            show: true,
            title: {
              zoom: "Zoom",
              back: "Back"
            }
          }
        },
        orient: "vertical",
        right: 10
      }
    };

    // Apply the options to the chart
    chartInstance.current.setOption(option);

    // Handle window resize
    const handleResize = () => {
      if (chartInstance.current) {
        chartInstance.current.resize();
      }
    };

    window.addEventListener("resize", handleResize);

    // Return a cleanup function
    const cleanup = () => {
      window.removeEventListener("resize", handleResize);
    };

    // This is just to satisfy TypeScript - we're not actually cleaning up yet
    // The real cleanup happens in the useEffect return
    cleanup();
  };

  // Helper function to get the rank name for a node based on its path
  const getRankNameForNode = (treePath: any[]): string => {
    if (!treePath || !taxonomicRanks || treePath.length <= 1) {
      return "Root";
    }
    // Depth in the tree corresponds to taxonomic rank index
    const rankIndex = treePath.length - 2; // -2 because the first element is the root
    if (rankIndex >= 0 && rankIndex < taxonomicRanks.length) {
      return capitalizeFirstLetter(taxonomicRanks[rankIndex]);
    }
    return "Unknown";
  };

  const processToTreeData = (
    aggregations: ElasticsearchResponse["aggregations"] | undefined,
    ranks: string[]
  ): TreeNode => {
    const root: TreeNode = {
      name: "Taxonomy",
      children: []
    };

    if (!aggregations) {
      return root;
    }

    const processRankBuckets = (
      buckets: Array<{ key: string; doc_count: number; [key: string]: any }>,
      rankIndex: number,
      parentNode: TreeNode
    ): void => {
      if (!buckets || rankIndex >= ranks.length) {
        return;
      }

      // Sort buckets by doc_count in descending order
      const sortedBuckets = [...buckets].sort(
        (a, b) => b.doc_count - a.doc_count
      );

      sortedBuckets.forEach((bucket) => {
        const node: TreeNode = {
          name: capitalizeFirstLetter(bucket.key),
          value: bucket.doc_count,
          children: []
        };

        if (!parentNode.children) {
          parentNode.children = [];
        }

        parentNode.children.push(node);

        const nextRankAggName = `taxonomy_${ranks[rankIndex + 1]}`;
        if (bucket[nextRankAggName]?.buckets && rankIndex + 1 < ranks.length) {
          processRankBuckets(
            bucket[nextRankAggName].buckets,
            rankIndex + 1,
            node
          );
        }
      });
    };

    const firstRankAggName = `taxonomy_${ranks[0]}`;
    if (aggregations[firstRankAggName]?.buckets) {
      processRankBuckets(aggregations[firstRankAggName].buckets, 0, root);
    }

    return root;
  };

  const capitalizeFirstLetter = (string: string): string => {
    if (!string) return "";
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
  };

  if (loading) {
    return <div className="loading">Loading taxonomy data...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  return (
    <div className="taxonomy-tree-container">
      <h2>Taxonomic Classification Tree</h2>
      <div className="taxonomy-ranks">
        <strong>Classification levels:</strong>{" "}
        {taxonomicRanks.map(capitalizeFirstLetter).join(" → ")}
      </div>
      <div
        ref={chartRef}
        className="chart-container"
        style={{ height: "700px", width: "100%" }}
      ></div>
      <div className="chart-instructions">
        <p>
          <strong>Interactions:</strong> Scroll to zoom, drag to pan, click on
          nodes to expand/collapse
        </p>
      </div>
    </div>
  );
}
