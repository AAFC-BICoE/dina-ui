import React, { useEffect, useState } from "react";
import { Tooltip, useApiClient } from "common-ui";
import { useMessage } from "../../context/MessageContext";
import { LoadingSpinner } from "common-ui";

export function prunePlaceholders(node) {
  if (!node) return null;

  const isPlaceholder = node.name.includes("MISSING");

  if (!node.children || node.children.length === 0) {
    return isPlaceholder ? null : node;
  }

  const prunedChildren = node.children.map(prunePlaceholders).filter(Boolean);

  if (prunedChildren.length === 0) {
    return isPlaceholder ? null : { ...node, children: [] };
  }

  return { ...node, children: prunedChildren };
}

/**
 * TaxonomicTreeNode component.
 *
 * Renders a node linked to its children displaying taxonomic ranks, compatible with Query Builder UI,
 * interacts with TaxonomicChart to affect data displayed.
 *
 * @returns {React.JSX.Element} The rendered node component.
 */

export default function TaxonomicTreeNode({ query }) {
  const { apiClient } = useApiClient();
  const { setMessage } = useMessage();

  interface TreeNodeData {
    id: string;
    name: string;
    count: number;
    children: TreeNodeData[];
  }

  const [root, setRoot] = useState<TreeNodeData | null>(null);

  // Find an aggregation key that ends with the given suffix (e.g. "by_kingdom")
  function findAgg(obj: any, suffix: string) {
    if (!obj) return undefined;
    const key = Object.keys(obj).find((k) => k.endsWith(suffix));
    return key ? obj[key] : undefined;
  }

  function buildTree(buckets: any[]): TreeNodeData[] {
    return buckets.map((b) => {
      //ensures different ids for drilldown
      const node: TreeNodeData = {
        id: b.key + b.doc_count,
        name: b.key,
        count: b.doc_count ?? 0,
        children: []
      };

      const phylumAgg = findAgg(b, "by_phylum");
      const classAgg = findAgg(b, "by_class");
      const orderAgg = findAgg(b, "by_order");
      const familyAgg = findAgg(b, "by_family");
      const genusAgg = findAgg(b, "by_genus");
      const speciesAgg = findAgg(b, "by_species");

      if (phylumAgg) node.children = buildTree(phylumAgg.buckets);
      if (classAgg) node.children = buildTree(classAgg.buckets);
      if (orderAgg) node.children = buildTree(orderAgg.buckets);
      if (familyAgg) node.children = buildTree(familyAgg.buckets);
      if (genusAgg) node.children = buildTree(genusAgg.buckets);
      if (speciesAgg) node.children = buildTree(speciesAgg.buckets);

      return node;
    });
  }

  useEffect(() => {
    async function load() {
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
                  missing: "MISSING KINGDOM"
                },
                aggs: {
                  by_phylum: {
                    terms: {
                      field:
                        "data.attributes.targetOrganismPrimaryClassification.phylum.keyword",
                      size: 100,
                      missing: "MISSING PHYLUM"
                    },
                    aggs: {
                      by_class: {
                        terms: {
                          field:
                            "data.attributes.targetOrganismPrimaryClassification.class.keyword",
                          size: 100,
                          missing: "MISSING CLASS"
                        },
                        aggs: {
                          by_order: {
                            terms: {
                              field:
                                "data.attributes.targetOrganismPrimaryClassification.order.keyword",
                              size: 100,
                              missing: "MISSING ORDER"
                            },
                            aggs: {
                              by_family: {
                                terms: {
                                  field:
                                    "data.attributes.targetOrganismPrimaryClassification.family.keyword",
                                  size: 10000,
                                  missing: "MISSING FAMILY"
                                },
                                aggs: {
                                  by_genus: {
                                    terms: {
                                      field:
                                        "data.attributes.targetOrganismPrimaryClassification.genus.keyword",
                                      size: 10000,
                                      missing: "MISSING GENUS"
                                    },
                                    aggs: {
                                      by_species: {
                                        terms: {
                                          field:
                                            "data.attributes.targetOrganismPrimaryClassification.species.keyword",
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

        const aggs = response.data.aggregations;
        const kingdomAgg = findAgg(aggs, "by_kingdom");
        const buckets = kingdomAgg?.buckets || [];

        const tree: TreeNodeData = {
          id: "root",
          name: "Taxonomic Tree",
          count: 0,
          children: buildTree(buckets)
        };

        const prunedTree = prunePlaceholders(tree);

        setRoot(prunedTree);
      } catch (err) {
        console.error("Error loading taxonomy:", err);
      }
    }

    load();
  }, [query]);

  function RenderNode({ node }: { node: TreeNodeData }) {
    const [expanded, setExpanded] = useState(node.id === "root");
    const hasChildren = node.children.length > 0;

    return (
      <div style={{ marginLeft: node.id === "root" ? 0 : 16 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "4px 0",
            cursor: hasChildren ? "pointer" : "default",
            fontWeight: node.id === "root" ? 600 : 400,
            fontSize: node.id === "root" ? "1.1rem" : "0.95rem",
            color: "#222"
          }}
        >
          {node.name === "Taxonomic Tree" ? (
            <Tooltip id="addTaxonomicTreeTooltip" />
          ) : null}

          {hasChildren ? (
            <span
              onClick={() => hasChildren && setExpanded(!expanded)}
              style={{
                display: "inline-block",
                transition: "transform 0.2s ease",
                transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
                color: "#666"
              }}
            >
              ▶
            </span>
          ) : (
            <span style={{ width: 12, display: "inline-block" }}>•</span>
          )}

          <span onClick={() => setMessage(node.id)}>{node.name}</span>

          {node.id !== "root" && (
            <span
              style={{
                background: "#e8e8e8",
                borderRadius: 12,
                padding: "1px 8px",
                fontSize: "0.75rem",
                color: "#555"
              }}
            >
              {node.count}
            </span>
          )}
        </div>

        <div
          style={{
            marginLeft: 14,
            borderLeft: hasChildren ? "1px solid #ddd" : "none",
            paddingLeft: 10,
            display: expanded ? "block" : "none",
            transition: "all 0.2s ease"
          }}
        >
          {expanded &&
            node.children.map((child) => (
              <RenderNode key={child.id} node={child} />
            ))}
        </div>
      </div>
    );
  }

  if (!root)
    return (
      <div>
        <LoadingSpinner loading={!root} />
      </div>
    );

  return <RenderNode node={root} />;
}
