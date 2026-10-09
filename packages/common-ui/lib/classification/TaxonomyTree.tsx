import React, { useEffect, useMemo, useState, useRef } from "react";
import * as echarts from "echarts";
import { IntlShape, useIntl } from "react-intl";
import { FaArrowRotateRight, FaDownload } from "react-icons/fa6";
import { useApiClient } from "..";
import useVocabularyOptions from "@dina-ui/components/collection/useVocabularyOptions";
import { DinaMessage } from "@dina-ui/intl/dina-ui-intl";
import { LoadingSpinner } from "../loading-spinner/LoadingSpinner";
import { Tooltip } from "../tooltip/Tooltip";
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

export interface TaxonomyTreeProps {
  /**
   * Optional query to filter the material samples for the taxonomy data.
   */
  inputQuery?: any;
}

const FONT =
  '"Segoe UI", system-ui, -apple-system, "Helvetica Neue", Arial, sans-serif';
const NAVY = "#335075";
const MUTED = "#6c757d";
const TREE_LEFT = 16;
const TREE_RIGHT = 150;
const HEADER_Y = 26;

const capitalizeFirstLetter = (string: string): string => {
  if (!string) return "";
  return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
};

const countLeaves = (node: TreeNode): number =>
  node.children?.length
    ? node.children.reduce((sum, child) => sum + countLeaves(child), 0)
    : 1;

/** Deepest expanded depth below an ECharts tree node, i.e. what its layout spaces columns by. */
const visibleDepth = (node: { isExpand: boolean; children: any[] }): number =>
  node.isExpand && node.children.length
    ? 1 + Math.max(...node.children.map(visibleDepth))
    : 0;

export interface TaxonomyTreeOptionParams {
  tree: TreeNode;
  /** Rank keys in vocabulary order, e.g. ["kingdom", "phylum", ...]. */
  ranks: string[];
  /** Localized rank labels keyed by rank key. */
  rankLabels: Record<string, string>;
  formatMessage: IntlShape["formatMessage"];
}

/** Builds the left-to-right, one-column-per-rank tree option. */
export function buildTaxonomyTreeOption({
  tree,
  ranks,
  rankLabels,
  formatMessage
}: TaxonomyTreeOptionParams): echarts.EChartsOption {
  const total = tree.value ?? 0;
  const genusIndex = ranks.indexOf("genus");

  // Genus and lower ranks are italicized by taxonomic convention.
  const decorate = (node: TreeNode) => ({
    ...node,
    rankLabel: node.rank
      ? rankLabels[node.rank] || capitalizeFirstLetter(node.rank)
      : undefined,
    it: genusIndex !== -1 && ranks.indexOf(node.rank ?? "") >= genusIndex,
    children: node.children?.map(decorate)
  });

  const label = {
    position: "right" as const,
    distance: 8,
    verticalAlign: "middle" as const,
    align: "left" as const,
    rich: {
      n: { color: "#333", fontWeight: 600, fontSize: 13, fontFamily: FONT },
      i: {
        color: "#333",
        fontWeight: 600,
        fontSize: 13,
        fontStyle: "italic" as const,
        fontFamily: FONT
      },
      // Count badge, styled like a Bootstrap pill.
      c: {
        color: "#495057",
        fontSize: 11,
        fontWeight: 600,
        fontFamily: FONT,
        backgroundColor: "#e9ecef",
        borderColor: "#dee2e6",
        borderWidth: 1,
        borderRadius: 8,
        padding: [2, 6]
      }
    },
    formatter: ({ data }: any) =>
      `{${data.it ? "i" : "n"}|${data.name}} {c|${(
        data.value ?? 0
      ).toLocaleString()}}`
  };

  return {
    animation: false,
    textStyle: { fontFamily: FONT },
    tooltip: {
      trigger: "item",
      backgroundColor: "#fff",
      borderColor: "#dee2e6",
      borderWidth: 1,
      padding: [6, 10],
      textStyle: { color: "#333", fontSize: 13, fontFamily: FONT },
      extraCssText:
        "box-shadow:0 .5rem 1rem rgba(0,0,0,.15);border-radius:.375rem;",
      formatter: ({ data }: any) => {
        const records = formatMessage(
          { id: "taxonomyHierarchyNodeRecords" },
          {
            count: (data.value ?? 0).toLocaleString(),
            percent: total ? Math.round(((data.value ?? 0) / total) * 100) : 0
          }
        );
        if (!data.rank) {
          return `${formatMessage({
            id: "taxonomyHierarchyRootTooltip"
          })}<br/>${records}`;
        }
        const name = echarts.format.encodeHTML(data.name);
        return `${echarts.format.encodeHTML(data.rankLabel)}<br/><b${
          data.it ? ' style="font-style:italic"' : ""
        }>${name}</b><br/>${records}`;
      }
    },
    series: [
      {
        type: "tree",
        name: "Taxonomy",
        data: [{ ...decorate(tree), name: formatMessage({ id: "all" }) }],
        orient: "LR",
        left: TREE_LEFT,
        right: TREE_RIGHT,
        top: 48,
        bottom: 16,
        roam: false,
        expandAndCollapse: true,
        initialTreeDepth: -1, // Show all expanded nodes
        animation: false,
        symbol: "circle",
        // Scaled to the total so dense datasets keep the root at a fixed size.
        symbolSize: (value: number) =>
          6 + 18 * Math.sqrt((value || 0) / (total || 1)),
        edgeShape: "curve",
        lineStyle: { color: "#ced4da", width: 1.5, curveness: 0.5 },
        itemStyle: { color: NAVY, borderColor: NAVY },
        label,
        leaves: { label },
        emphasis: { focus: "ancestor", lineStyle: { color: NAVY, width: 2 } }
      }
    ]
  };
}

/** Rank headers and column guides at the x positions ECharts' LR tree layout gives each depth. */
export function buildRankGraphics(
  width: number,
  height: number,
  headers: string[]
) {
  // ECharts spaces depths evenly: (width - left - right) / deepest visible depth.
  const step = (width - TREE_LEFT - TREE_RIGHT) / (headers.length || 1);
  return [
    ...headers.flatMap((text, i) => {
      const x = TREE_LEFT + step * (i + 1);
      return [
        new echarts.graphic.Line({
          silent: true,
          z: -1,
          shape: { x1: x, y1: HEADER_Y, x2: x, y2: height },
          style: { stroke: "#f0f1f3" }
        }),
        new echarts.graphic.Text({
          silent: true,
          x: x - 4,
          y: 4,
          style: { text, fill: MUTED, font: `600 12px ${FONT}` }
        })
      ];
    }),
    new echarts.graphic.Line({
      silent: true,
      shape: { x1: 0, y1: HEADER_Y, x2: width, y2: HEADER_Y },
      style: { stroke: "#dee2e6" }
    })
  ];
}

/**
 * Draws the rank columns and redraws them whenever the visible depth or the size changes
 * (load, collapse, resize). Returns a function that removes them.
 */
export function bindRankColumns(chart: echarts.ECharts, rankHeaders: string[]) {
  // Drawn on zrender directly: any setOption call rebuilds the tree and re-expands collapsed nodes.
  const columns = new echarts.graphic.Group({ silent: true });
  chart.getZr().add(columns);
  let columnsKey = "";
  const redraw = () => {
    // getModel is untyped internal API, but the only way to see which nodes are collapsed.
    const realRoot = (chart as any).getModel().getSeriesByIndex(0)?.getData()
      .tree.root.children[0];
    const depth = realRoot ? visibleDepth(realRoot) : 0;
    const key = `${chart.getWidth()}x${chart.getHeight()}:${depth}`;
    if (key === columnsKey) return;
    columnsKey = key;
    columns.removeAll();
    buildRankGraphics(
      chart.getWidth(),
      chart.getHeight(),
      rankHeaders.slice(0, depth)
    ).forEach((element) => columns.add(element));
  };
  chart.on("finished", redraw);

  return () => {
    if (chart.isDisposed()) return;
    chart.off("finished", redraw);
    chart.getZr().remove(columns);
  };
}

export default function TaxonomyTree({ inputQuery }: TaxonomyTreeProps) {
  const [error, setError] = useState<string | null>(null);
  const [taxonomicRanks, setTaxonomicRanks] = useState<string[]>([]);
  const [rankLabels, setRankLabels] = useState<Record<string, string>>({});
  const [treeData, setTreeData] = useState<TreeNode>({ name: "Taxonomy" });
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);
  const { apiClient } = useApiClient();
  const { formatMessage } = useIntl();

  // Retrieve the classification options
  const { loading, vocabOptions: taxonomicRankOptions } = useVocabularyOptions({
    path: "collection-api/vocabulary2/taxonomicRank"
  });

  useEffect(() => {
    const handleResize = () => chartInstance.current?.resize();
    window.addEventListener("resize", handleResize);
    // Clean up chart on unmount
    return () => {
      window.removeEventListener("resize", handleResize);
      chartInstance.current?.dispose();
      // Effects can re-run without remounting (Fast Refresh, hidden Activity); init a fresh chart then.
      chartInstance.current = null;
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
        setRankLabels(
          Object.fromEntries(
            taxonomicRankOptions.map((option) => [
              option.value.toLowerCase(),
              // The vocabulary titles are lowercase, e.g. "kingdom" and "règne".
              capitalizeFirstLetter(option.label)
            ])
          )
        );
        // Only fetch the top level (kingdom) initially
        fetchTaxonomyData(ranks[0], undefined, undefined, inputQuery);
      }
    }
  }, [loading, inputQuery]);

  const option = useMemo(
    () =>
      buildTaxonomyTreeOption({
        tree: treeData,
        ranks: taxonomicRanks,
        rankLabels,
        formatMessage
      }),
    [treeData, taxonomicRanks, rankLabels, formatMessage]
  );

  // About 46px per leaf so dense trees don't squash together.
  const chartHeight = Math.max(460, countLeaves(treeData) * 46);

  // Update the chart whenever the tree data changes
  useEffect(() => {
    if (!chartRef.current) return;
    const chart = (chartInstance.current ??= echarts.init(chartRef.current));

    // Handlers are re-bound so they see the current ranks and input query.
    chart.off("click");
    chart.on("click", "series", handleNodeClick);

    const unbindRankColumns = bindRankColumns(
      chart,
      taxonomicRanks.map(
        (rank) => rankLabels[rank] || capitalizeFirstLetter(rank)
      )
    );

    chart.resize(); // The container height follows the leaf count.
    chart.setOption(option, true);
    return unbindRankColumns;
  }, [option]);

  // Build optimized query for taxonomic aggregations
  const buildTaxonomyQuery = (
    rank: string,
    parentRanksAndValues: Array<{ rank: string; value: string }> = [],
    inputQuery?: any
  ): Record<string, any> => {
    // Create the query structure
    const query: Record<string, any> = {
      size: 0,
      aggs: {
        [`taxonomy_${rank}`]: {
          terms: {
            field: `data.attributes.targetIdentifiableEntitySummary.primaryDetermination.classification.${rank}.keyword`,
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
          [`data.attributes.targetIdentifiableEntitySummary.primaryDetermination.classification.${rank}.keyword`]:
            value
        }
      }));

      query.query = {
        bool: {
          must
        }
      };
      // If there's an input query, add it to the must array
      if (inputQuery) {
        query.query.bool.must.push(inputQuery);
      }

      // If no query is provided, we still want to filter by input query.
    } else if (inputQuery) {
      query.query = {
        bool: {
          must: [inputQuery]
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
    parentNodeId?: string,
    inputQuery?: any
  ): Promise<void> => {
    try {
      const query = buildTaxonomyQuery(rank, parentNodePath, inputQuery);

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
        const children = buckets.map((bucket) => ({
          // Kept as stored: it is shown as-is and is the exact term filter for drilling down.
          name: bucket.key,
          value: bucket.doc_count,
          id: `${rank}_${bucket.key}`,
          rank: rank,
          parentPath: [...parentNodePath], // Store the full path to this node
          loaded: false,
          children: []
        }));

        // If this is the top level, create a new tree
        if (!parentNodeId) {
          setTreeData({
            name: capitalizeFirstLetter(rank),
            value: children.reduce((sum, child) => sum + child.value, 0),
            children
          });
        } else {
          // Otherwise, update the existing tree by finding the parent node and adding children
          setTreeData((prevData) => {
            // Create a deep copy of the tree to avoid reference issues
            const newData = JSON.parse(JSON.stringify(prevData));

            // Find the parent node and update its children
            const updateNodeChildren = (
              node: TreeNode,
              nodeId: string
            ): boolean => {
              if (node.id === nodeId) {
                // Add children to this node
                node.children = children;
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

      fetchTaxonomyData(nextRank, parentPath, node.id, inputQuery);
    }
  };

  const downloadImage = () => {
    const url = chartInstance.current?.getDataURL({
      type: "png",
      pixelRatio: 2,
      backgroundColor: "#fff"
    });
    if (!url) return;
    const link = document.createElement("a");
    link.href = url;
    link.download = "taxonomic_tree.png";
    link.click();
  };

  if (loading) {
    return <LoadingSpinner loading={loading} />;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  return (
    <div className="taxonomy-tree-container">
      <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
        <strong>
          <DinaMessage id="taxonomicHierarchy" />
        </strong>
        <Tooltip
          disableSpanMargin={true}
          directComponent={
            <>
              <DinaMessage id="taxonomyHierarchySubtitle" />
              {"\n\n"}
              <DinaMessage id="taxonomyHierarchyChartInstructions" />
            </>
          }
        />
        <span className="text-muted">
          <DinaMessage
            id="taxonomyHierarchyRecordCount"
            values={{ total: (treeData.value ?? 0).toLocaleString() }}
          />
        </span>
        <div className="ms-auto d-flex gap-2">
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            disabled={!taxonomicRanks.length}
            onClick={() =>
              fetchTaxonomyData(
                taxonomicRanks[0],
                undefined,
                undefined,
                inputQuery
              )
            }
          >
            <FaArrowRotateRight className="me-1" />
            <DinaMessage id="refreshButtonText" />
          </button>
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            onClick={downloadImage}
          >
            <FaDownload className="me-1" />
            <DinaMessage id="downloadFile" />
          </button>
        </div>
      </div>
      <div ref={chartRef} style={{ height: chartHeight, width: "100%" }} />
    </div>
  );
}
