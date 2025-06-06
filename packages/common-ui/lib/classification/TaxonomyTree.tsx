import React, { useEffect, useState, useRef } from "react";
import * as echarts from "echarts";
import "./TaxonomyTree.css";
import { useApiClient } from "..";
import useVocabularyOptions from "../../../dina-ui/components/collection/useVocabularyOptions";
import { DinaMessage } from "packages/dina-ui/intl/dina-ui-intl";

interface TreeNode {
  name: string;
  value?: number;
  children?: TreeNode[];
  id?: string; // Unique identifier for each node
  parentPath?: Array<{ rank: string; value: string }>; // Path of parent taxonomic ranks
  rank?: string; // The taxonomic rank of this node
  loaded?: boolean; // Whether children have been loaded
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
  hits?: {
    total?: {
      value: number;
    };
  };
}

export default function TaxonomyTree() {
  const [error, setError] = useState<string | null>(null);
  const [taxonomicRanks, setTaxonomicRanks] = useState<string[]>([]);
  const [treeData, setTreeData] = useState<TreeNode>({ name: "Taxonomy" });
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);
  const expandedNodesRef = useRef<Set<string>>(new Set()); // Track expanded nodes
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
        // Only fetch the top level (kingdom) initially
        fetchTaxonomyData(ranks[0]);
      }
    }
  }, [loading]);

  // Update the chart whenever treeData changes
  useEffect(() => {
    if (treeData && chartRef.current) {
      renderChart();
    }
  }, [treeData]);

  // Build optimized query for taxonomic aggregations
  const buildTaxonomyQuery = (
    rank: string,
    parentRanksAndValues: Array<{ rank: string; value: string }> = []
  ): Record<string, any> => {
    // Create the query structure
    const query: Record<string, any> = {
      size: 0,
      aggs: {
        [`taxonomy_${rank}`]: {
          terms: {
            field: `data.attributes.targetOrganismPrimaryClassification.${rank}.keyword`,
            size: 10000,
            order: { _count: "desc" }
          }
        }
      }
    };

    // Add filters for parent taxonomic ranks if provided
    if (parentRanksAndValues.length > 0) {
      const must = parentRanksAndValues.map(({ rank, value }) => ({
        term: {
          [`data.attributes.targetOrganismPrimaryClassification.${rank}.keyword`]:
            value
        }
      }));

      query.query = {
        bool: {
          must
        }
      };
    }

    return query;
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

  // Fetch data for a specific rank
  const fetchTaxonomyData = async (
    rank: string,
    parentNodePath: Array<{ rank: string; value: string }> = [],
    parentNodeId?: string
  ): Promise<void> => {
    try {
      const query = buildTaxonomyQuery(rank, parentNodePath);

      const response = await apiClient.axios.post<ElasticsearchResponse>(
        `search-api/search-ws/search`,
        query,
        {
          params: {
            indexName: "dina_material_sample_index"
          }
        }
      );

      // Process the data and update the tree
      if (response.data.aggregations) {
        const rankAggName = `taxonomy_${rank}`;
        const aggKey = getAggregationKey(rankAggName, response.data);
        const buckets = response.data.aggregations[aggKey]?.buckets || [];

        // If this is the top level, create a new tree
        if (!parentNodeId) {
          const rootChildren = buckets.map((bucket) => ({
            name: capitalizeFirstLetter(bucket.key),
            value: bucket.doc_count,
            id: `${rank}_${bucket.key}`,
            rank: rank,
            parentPath: [], // Empty for top level
            loaded: false,
            children: []
          }));

          setTreeData({
            name: capitalizeFirstLetter(rank),
            children: rootChildren
          });
        } else {
          // Otherwise, update the existing tree by finding the parent node and adding children
          setTreeData((prevData) => {
            // Create a deep copy of the tree to avoid reference issues
            const newData = JSON.parse(JSON.stringify(prevData));

            // Track that this node is expanded
            expandedNodesRef.current.add(parentNodeId);

            // Find the parent node and update its children
            const updateNodeChildren = (
              node: TreeNode,
              nodeId: string
            ): boolean => {
              if (node.id === nodeId) {
                // Add children to this node
                node.children = buckets.map((bucket) => ({
                  name: capitalizeFirstLetter(bucket.key),
                  value: bucket.doc_count,
                  id: `${rank}_${bucket.key}`,
                  rank: rank,
                  parentPath: [...parentNodePath], // Store the full path to this node
                  loaded: false,
                  children: []
                }));
                node.loaded = true;
                return true;
              }

              if (node.children) {
                for (const child of node.children) {
                  if (updateNodeChildren(child, nodeId)) {
                    return true;
                  }
                }
              }
              return false;
            };

            updateNodeChildren(newData, parentNodeId);
            return newData;
          });
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error fetching data");
    }
  };

  // Handle node click event
  const handleNodeClick = (nodeData: any) => {
    const node = nodeData.data;

    if (!node.id || !node.rank) {
      return; // Skip if not a valid taxonomic node
    }

    // Get the current rank index
    const currentRankIndex = taxonomicRanks.indexOf(node.rank);

    // If there's a next rank and children haven't been loaded yet
    if (currentRankIndex < taxonomicRanks.length - 1 && !node.loaded) {
      const nextRank = taxonomicRanks[currentRankIndex + 1];

      // Build the parent path for the query
      // Start with any existing parent path the node has
      const parentPath = node.parentPath ? [...node.parentPath] : [];

      // Add this node to the path
      parentPath.push({
        rank: node.rank,
        value: node.name
      });

      fetchTaxonomyData(nextRank, parentPath, node.id);
    } else if (node.loaded) {
      // Toggle expanded state if already loaded
      if (expandedNodesRef.current.has(node.id)) {
        expandedNodesRef.current.delete(node.id);
      } else {
        expandedNodesRef.current.add(node.id);
      }
    }
  };

  const renderChart = (): void => {
    if (!chartRef.current) return;

    // Initialize chart if it doesn't exist
    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current);

      // Add click event handler
      chartInstance.current.on("click", "series", (params) => {
        handleNodeClick(params);
      });
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
          const { name, value, rank } = params.data;
          if (value) {
            return `<div class="tooltip-content">
                     <strong>${name}</strong><br/>
                     Count: ${value.toLocaleString()}<br/>
                     Rank: ${rank ? capitalizeFirstLetter(rank) : "Root"}
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
          top: "5%",
          left: "5%",
          bottom: "5%",
          right: "25%",
          symbolSize: (value: number) => {
            if (!value) return 7;
            // Scale node size based on log of count
            return Math.max(7, Math.min(25, 5 + Math.log10(value) * 3));
          },
          symbol: "circle",
          // Set orientation to vertical
          orient: "vertical",
          layout: "orthogonal",
          itemStyle: {
            color: (params) => {
              const depth = params.treePathInfo
                ? params.treePathInfo.length - 1
                : 0;
              return levelColors[depth % levelColors.length];
            },
            borderWidth: 1,
            borderColor: "#fff"
          } as any,
          label: {
            // Adjust label position for vertical layout
            position: "right",
            verticalAlign: "middle",
            align: "left",
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
          initialTreeDepth: -1, // Show all expanded nodes
          animationDuration: 550,
          animationDurationUpdate: 750,
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
    chartInstance.current.setOption(option, true); // Force update

    // Handle window resize
    const handleResize = () => {
      if (chartInstance.current) {
        chartInstance.current.resize();
      }
    };

    window.addEventListener("resize", handleResize);

    // This cleanup is handled by the useEffect
    return;
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
      <div className="chart-instructions mb-2">
        <strong>
          <DinaMessage id="taxonomyHierarchySubtitle" />
        </strong>
      </div>
      <div
        ref={chartRef}
        className="chart-container"
        style={{ height: "700px", width: "100%" }}
      ></div>
      <div className="taxonomy-ranks">
        <strong>
          <DinaMessage id="classificationlevels" />
        </strong>
        {taxonomicRanks.map(capitalizeFirstLetter).join(" → ")}
      </div>
      <div className="chart-instructions">
        <strong>
          <DinaMessage id="taxonomyHierarchyChartInstructions" />
        </strong>
      </div>
    </div>
  );
}
