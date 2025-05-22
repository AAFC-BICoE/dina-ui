import React, { useEffect, useState, useRef } from "react";
import * as echarts from "echarts";
import "./TaxonomyTree.css";
import { useApiClient } from "..";
import useVocabularyOptions from "../../../dina-ui/components/collection/useVocabularyOptions";

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

  // Build query for a specific rank, with proper constraints for all parent ranks
  const buildRankQuery = (
    rank: string,
    parentRanksAndValues: Array<{ rank: string; value: string }> = []
  ): Record<string, any> => {
    const query: Record<string, any> = {
      size: 0,
      aggs: {
        [`taxonomy_${rank}`]: {
          terms: {
            field: `data.attributes.targetOrganismPrimaryClassification.${rank}.keyword`,
            size: 10000
          }
        }
      }
    };

    // Add filters for all parent ranks if provided
    if (parentRanksAndValues.length > 0) {
      const mustClauses = parentRanksAndValues.map(({ rank, value }) => ({
        term: {
          [`data.attributes.targetOrganismPrimaryClassification.${rank}.keyword`]:
            value
        }
      }));

      query.query = {
        bool: {
          must: mustClauses
        }
      };
    }

    return query;
  };

  // Helper function to get aggregation key format
  const getAggregationKey = (aggName: string, response: any): string => {
    // Check different possible formats
    if (response.aggregations[aggName]) {
      return aggName;
    }
    if (response.aggregations[`sterms#${aggName}`]) {
      return `sterms#${aggName}`;
    }

    // Look for any key that ends with the aggName
    for (const key of Object.keys(response.aggregations)) {
      if (key.endsWith(aggName)) {
        return key;
      }
    }

    console.warn(`Aggregation key for ${aggName} not found in response`);
    return aggName; // Fallback
  };

  // Fetch data for a specific rank
  const fetchTaxonomyData = async (
    rank: string,
    parentNodePath: Array<{ rank: string; value: string }> = [],
    parentNodeId?: string
  ): Promise<void> => {
    try {
      const query = buildRankQuery(rank, parentNodePath);

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
      console.error("Error fetching taxonomy data:", err);
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
        value: node.name.toLowerCase()
      });

      fetchTaxonomyData(nextRank, parentPath, node.id);
    } else if (node.loaded) {
      // Toggle expanded state if already loaded
      if (expandedNodesRef.current.has(node.id)) {
        expandedNodesRef.current.delete(node.id);
      } else {
        expandedNodesRef.current.add(node.id);
      }

      // Refresh the chart to apply expansion state
      if (chartInstance.current) {
        chartInstance.current.setOption({
          series: [
            {
              type: "tree",
              data: [treeData]
            }
          ]
        });
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
          orient: "vertical",
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
            },
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
          initialTreeDepth: -1, // Show all expanded nodes
          animationDuration: 550,
          animationDurationUpdate: 750,
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
          nodes to fetch child taxonomic ranks
        </p>
      </div>
    </div>
  );
}
