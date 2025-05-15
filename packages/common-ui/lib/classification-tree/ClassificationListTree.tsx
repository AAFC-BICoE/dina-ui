import React, { useEffect, useState } from "react";
import "./ClassificationTree.css"; // Create this CSS file for styling
import { useApiClient } from "../api-client/ApiClientContext";

// Define interface for taxonomy nodes
interface TaxonomyNode {
  id: string;
  name: string;
  count: number;
  level: number;
  children: TaxonomyNode[];
}

const ClassificationListTree = () => {
  const [taxonomyData, setTaxonomyData] = useState<TaxonomyNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>(
    {}
  );
  const { apiClient } = useApiClient();

  useEffect(() => {
    fetchTaxonomyData();
  }, []);

  const fetchTaxonomyData = async () => {
    try {
      setLoading(true);

      const response = await apiClient.axios.post(
        `search-api/search-ws/search`,
        {
          size: 0,
          aggs: {
            taxonomy_kingdom: {
              terms: {
                field:
                  "data.attributes.targetOrganismPrimaryClassification.kingdom.keyword",
                size: 10000
              },
              aggs: {
                taxonomy_phylum: {
                  terms: {
                    field:
                      "data.attributes.targetOrganismPrimaryClassification.phylum.keyword",
                    size: 10000
                  },
                  aggs: {
                    taxonomy_class: {
                      terms: {
                        field:
                          "data.attributes.targetOrganismPrimaryClassification.class.keyword",
                        size: 10000
                      },
                      aggs: {
                        taxonomy_order: {
                          terms: {
                            field:
                              "data.attributes.targetOrganismPrimaryClassification.order.keyword",
                            size: 10000
                          },
                          aggs: {
                            taxonomy_family: {
                              terms: {
                                field:
                                  "data.attributes.targetOrganismPrimaryClassification.family.keyword",
                                size: 10000
                              },
                              aggs: {
                                taxonomy_genus: {
                                  terms: {
                                    field:
                                      "data.attributes.targetOrganismPrimaryClassification.genus.keyword",
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
        },
        {
          params: {
            indexName: "dina_material_sample_index"
          }
        }
      );

      const processed = processDataToFlatStructure(response.data.aggregations);
      setTaxonomyData(processed);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching taxonomy data:", err);
      setError(err instanceof Error ? err.message : "Error fetching data");
      setLoading(false);
    }
  };

  const processDataToFlatStructure = (aggregations: any): TaxonomyNode[] => {
    const result: TaxonomyNode[] = [];

    if (aggregations?.taxonomy_kingdom?.buckets) {
      aggregations.taxonomy_kingdom.buckets.forEach((kingdom: any) => {
        const kingdomItem: TaxonomyNode = {
          id: `kingdom-${kingdom.key}`,
          name: capitalizeFirstLetter(kingdom.key),
          count: kingdom.doc_count,
          level: 0,
          children: []
        };

        if (kingdom.taxonomy_phylum?.buckets) {
          kingdom.taxonomy_phylum.buckets.forEach((phylum: any) => {
            const phylumItem: TaxonomyNode = {
              id: `phylum-${kingdom.key}-${phylum.key}`,
              name: capitalizeFirstLetter(phylum.key),
              count: phylum.doc_count,
              level: 1,
              children: []
            };

            if (phylum.taxonomy_class?.buckets) {
              phylum.taxonomy_class.buckets.forEach((classItem: any) => {
                const classNode: TaxonomyNode = {
                  id: `class-${kingdom.key}-${phylum.key}-${classItem.key}`,
                  name: capitalizeFirstLetter(classItem.key),
                  count: classItem.doc_count,
                  level: 2,
                  children: []
                };

                phylumItem.children.push(classNode);
              });
            }

            kingdomItem.children.push(phylumItem);
          });
        }

        result.push(kingdomItem);
      });
    }

    return result;
  };

  const capitalizeFirstLetter = (string: string): string => {
    if (!string) return "";
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
  };

  const toggleNode = (nodeId: string): void => {
    setExpandedNodes((prev) => ({
      ...prev,
      [nodeId]: !prev[nodeId]
    }));
  };

  const renderNode = (node: TaxonomyNode): JSX.Element => {
    const isExpanded = expandedNodes[node.id];
    const hasChildren = node.children && node.children.length > 0;

    return (
      <React.Fragment key={node.id}>
        <div
          className={`taxonomy-item level-${node.level}`}
          onClick={() => hasChildren && toggleNode(node.id)}
        >
          {hasChildren && (
            <span className="toggle-icon">{isExpanded ? "▼" : "►"}</span>
          )}
          <span className="taxonomy-name">{node.name}</span>
          <span className="taxonomy-count">{node.count.toLocaleString()}</span>
        </div>

        {isExpanded && hasChildren && (
          <div className="children-container">
            {node.children.map((child) => renderNode(child))}
          </div>
        )}
      </React.Fragment>
    );
  };

  if (loading) {
    return <div className="loading">Loading taxonomy data...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  return (
    <div className="classification-list-container">
      <h3>Scientific name</h3>
      <div className="search-box">
        <input type="text" placeholder="Search" />
      </div>
      <div className="taxonomy-header">
        <span className="header-label">Explore</span>
        <span className="header-label">Major groups</span>
      </div>
      <div className="taxonomy-list">
        {taxonomyData.map((node) => renderNode(node))}
      </div>
    </div>
  );
};

export default ClassificationListTree;
