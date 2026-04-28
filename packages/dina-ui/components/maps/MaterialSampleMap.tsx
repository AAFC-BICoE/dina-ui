/**
 * MaterialSampleMap Component
 *
 * Displays material sample locations on an interactive map with clustering.
 * - Shows individual pins when below the cluster threshold
 * - Aggregates data into clusters when above the threshold
 * - Dynamically adjusts precision based on zoom level
 * - Fetches data from Elasticsearch API based on map extent
 */

import { useEffect, useRef } from "react";
import { getMapModules } from "../../utils/geoUtils";
import { useApiClient } from "common-ui";

/**
 * Converts map zoom level to geotile precision for Elasticsearch clustering.
 * Higher zoom levels result in finer precision (more granular tiles).
 * @param zoom - Current map zoom level (typically 0-28)
 * @returns Precision value (3-15) for geotile_grid aggregation
 */
function zoomToPrecision(zoom) {
  if (zoom >= 12) return 15;
  if (zoom >= 9) return 13;
  if (zoom >= 7) return 10;
  if (zoom >= 6) return 8;
  if (zoom >= 5) return 6;
  if (zoom >= 3) return 4;
  return 3;
}

/**
 * Props for the MaterialSampleMap component.
 */
export interface MaterialSampleMapProps {
  /** Total number of records available (used for size scaling) */
  totalRecords: number;
  /** Optional Elasticsearch query object to filter material samples */
  query?: any;
  /** Delay in milliseconds to debounce map extent changes (default: 250ms) */
  debounceDelay?: number;
  /** Threshold above which to use clustering instead of raw points (default: 500) */
  clusterThreshold?: number;
}

/**
 * MaterialSampleMap Component
 *
 * Renders an interactive map displaying material sample locations with smart clustering.
 * Uses Esri ArcGIS Maps SDK to handle mapping, and Elasticsearch for efficient data fetching.
 *
 * @param props - Component props
 * @returns React component with map container
 */
export default function MaterialSampleMap({
  totalRecords,
  query,
  debounceDelay = 250,
  clusterThreshold = 500
}: MaterialSampleMapProps) {
  // Refs for map components and state
  const mapRef = useRef(null);
  const viewRef = useRef(null);
  const featureLayerRef = useRef<any>(null);
  const totalRecordsRef = useRef(totalRecords);
  const { apiClient } = useApiClient();

  /**
   * Initialize map on component mount.
   * Sets up the ArcGIS map, layers, controls, and event listeners.
   */
  useEffect(() => {
    if (!mapRef.current) return;
    let watchHandle = null;
    let debounceTimer = null;

    // Dynamically load ArcGIS modules
    getMapModules().then(
      ({
        Map,
        MapView,
        FeatureLayer,
        Graphic,
        webMercatorUtils,
        projection,
        BasemapToggle,
        ScaleBar,
        Fullscreen
      }) => {
        // Initialize feature layer for displaying material sample points/clusters
        const layer = new FeatureLayer({
          source: [], // Initially empty, populated by API calls
          objectIdField: "ObjectID",
          geometryType: "point",
          spatialReference: { wkid: 4326 }, // WGS84
          outFields: ["*"],
          // Define fields for the feature layer
          fields: [
            { name: "ObjectID", type: "oid" },
            { name: "count", type: "integer" },
            { name: "sampleID", type: "string" },
            { name: "tileKey", type: "string" },
            { name: "sampleName", type: "string" },
            { name: "group", type: "string" }
          ],
          // Configure symbol rendering with size based on count
          renderer: {
            type: "simple",
            field: "count",
            symbol: {
              type: "simple-marker",
              color: [0, 128, 255, 0.7],
              outline: { color: [255, 255, 255], width: 1 }
            },
            visualVariables: [
              {
                type: "size",
                field: "count",
                minDataValue: 1,
                maxDataValue: totalRecordsRef.current ?? 1000, // Scale size based on count relative to total records in view.
                minSize: 30,
                maxSize: 60
              }
            ]
          },
          // Add labels showing count for clustered points
          labelingInfo: [
            {
              labelExpressionInfo: { expression: "$feature.count" },
              where: "count > 1", // Only show labels for clusters with multiple samples
              symbol: {
                type: "text",
                color: "black",
                haloColor: "white",
                haloSize: 1,
                font: { size: 12, weight: "bold" }
              },
              labelPlacement: "center-center",
              deconflictionStrategy: "none"
            }
          ],
          // Configure popup template for when users click on points
          popupTemplate: {
            title: "{count} sample(s) here",
            outFields: ["*"],
            content: (feature) => {
              // Generate popup content dynamically
              const div = document.createElement("div");

              // Show single sample with link or cluster info
              if (feature.graphic.attributes.count === 1) {
                const sampleID = feature.graphic.attributes.sampleID || "";
                const sampleName =
                  feature.graphic.attributes.sampleName || sampleID;
                const group = feature.graphic.attributes.group || "";

                div.innerHTML = `

            <a href="/collection/material-sample/view?id=${sampleID}" 
               target="_blank" 
               rel="noopener noreferrer">
              ${sampleName ?? sampleID}
            </a>  <br>
          ${group ? `Group: ${group}` : ""} 
        `;
              } else {
                // For clusters, show count
                div.innerHTML = `Cluster of ${feature.graphic.attributes.count} samples`;
              }

              return div;
            }
          }
        });
        featureLayerRef.current = layer;

        // Initialize the base map
        const map = new Map({
          basemap: "streets-vector",
          layers: [layer]
        });

        // Initialize the map view
        const mapViewInstance = new MapView({
          container: mapRef.current,
          map,
          center: [-95, 40], // Center on continental US
          zoom: 4,
          highlightOptions: {
            color: [226, 119, 40],
            haloOpacity: 0,
            fillOpacity: 0
          }
        });

        // Add basemap toggle control (streets <-> hybrid view)
        const basemapToggle = new BasemapToggle({
          view: mapViewInstance,
          nextBasemap: "hybrid"
        });
        mapViewInstance.ui.add(basemapToggle, "bottom-right");

        // Add scale bar control
        const scaleBar = new ScaleBar({
          view: mapViewInstance,
          unit: "metric"
        });
        mapViewInstance.ui.add(scaleBar, "bottom-left");

        // Add fullscreen toggle button
        const fullscreen = new Fullscreen({
          view: mapViewInstance
        });
        mapViewInstance.ui.add(fullscreen, "top-right");

        /**
         * Update map points with new graphics.
         * Clears existing features and adds new ones.
         * @param points - Array of point objects with coordinates and attributes
         */
        async function updateMapPoints(points) {
          // Prepare graphics from point data
          // Convert point data to Esri Graphic objects
          const graphics = points.map(
            (pt) =>
              new Graphic({
                geometry: {
                  type: "point",
                  longitude: pt.coordinates[0],
                  latitude: pt.coordinates[1],
                  spatialReference: { wkid: 4326 } // WGS84
                },
                attributes: {
                  count: pt.attributes?.count ?? 1,
                  sampleID: pt.attributes?.sampleID ?? "",
                  tileKey: pt.attributes?.tileKey ?? "",
                  sampleName: pt.attributes?.sampleName ?? "",
                  group: pt.attributes?.group ?? ""
                }
              })
          );

          // Apply edits: delete old features, add new ones
          featureLayerRef.current.queryFeatures().then((result) => {
            featureLayerRef.current.applyEdits({
              deleteFeatures: result.features,
              addFeatures: graphics
            });
          });
        }

        /**
         * Fetch material sample data for the current map extent.
         * Chooses between raw points (below threshold) or aggregated clusters.
         * @param extent - Current map extent
         */
        async function fetchDataWithinExtent(extent) {
          const zoom = (viewRef.current as any).zoom;

          // Convert extent to WGS84 (EPSG:4326) for consistent processing
          if (extent.spatialReference.isWebMercator) {
            extent = webMercatorUtils.webMercatorToGeographic(extent);
          }
          // Already in WGS84
          else if (extent.spatialReference.wkid === 4326) {
            extent = extent;
          }
          // Other projections - convert using projection engine
          else {
            extent = projection.project(extent, { wkid: 4326 });
          }

          // Extract bounding box coordinates from extent
          const topleft = [extent.xmin.toFixed(8), extent.ymax.toFixed(8)];
          const bottomright = [extent.xmax.toFixed(8), extent.ymin.toFixed(8)];

          /**
           * Build Elasticsearch query with geo bounding box filter.
           * Combines provided query (if any) with location filter.
           * @returns Elasticsearch query object
           */
          function buildQuery() {
            // If parent query exists, add geo filter to it
            if (query && query.bool && query.bool.must) {
              query.bool.must.push({
                nested: {
                  path: "included",
                  query: {
                    bool: {
                      must: [
                        {
                          exists: {
                            field: "included.attributes.eventGeom"
                          }
                        },
                        {
                          term: { "included.type": "collecting-event" }
                        }
                      ],
                      filter: [
                        {
                          geo_bounding_box: {
                            "included.attributes.eventGeom": {
                              top_left: {
                                lat: topleft[1],
                                lon: topleft[0]
                              },
                              bottom_right: {
                                lat: bottomright[1],
                                lon: bottomright[0]
                              }
                            }
                          }
                        }
                      ]
                    }
                  }
                }
              });
              return query;
            } else {
              // Build new query with just geo filter
              return {
                bool: {
                  must: [
                    {
                      nested: {
                        path: "included",
                        query: {
                          bool: {
                            must: [
                              {
                                exists: {
                                  field: "included.attributes.eventGeom"
                                }
                              },
                              {
                                term: { "included.type": "collecting-event" }
                              }
                            ],
                            filter: [
                              {
                                geo_bounding_box: {
                                  "included.attributes.eventGeom": {
                                    top_left: {
                                      lat: topleft[1],
                                      lon: topleft[0]
                                    },
                                    bottom_right: {
                                      lat: bottomright[1],
                                      lon: bottomright[0]
                                    }
                                  }
                                }
                              }
                            ]
                          }
                        }
                      }
                    }
                  ]
                }
              };
            }
          }

          try {
            // First, fetch total count of matching records in extent
            const count_response = await apiClient.axios.post(
              "search-api/search-ws/search",
              {
                size: 0,
                query: buildQuery()
              },
              { params: { indexName: "dina_material_sample_index" } }
            );
            totalRecordsRef.current = count_response.data.hits.total.value;

            if (count_response.data.hits.total.value < clusterThreshold) {
              // Below threshold: fetch and display individual sample points
              const points_response = await apiClient.axios.post(
                "search-api/search-ws/search",
                {
                  size: 5000,
                  query: buildQuery(),
                  _source: {
                    includes: [
                      "data.id",
                      "included.attributes.eventGeom",
                      "included.type",
                      "data.attributes.materialSampleName",
                      "data.attributes.group"
                    ]
                  }
                },
                { params: { indexName: "dina_material_sample_index" } }
              );

              // Transform Elasticsearch documents into point objects
              const hits = points_response.data.hits.hits;
              const points = hits
                .map((doc) => {
                  // Extract location and attributes from nested document structure
                  const id = doc._id;
                  const includedArr = doc._source?.included ?? [];
                  // Find the collecting event with geometry
                  const collectingEvent = includedArr.find(
                    (e) =>
                      e.type === "collecting-event" &&
                      Array.isArray(e.attributes?.eventGeom)
                  );

                  const attributes = doc._source?.data?.attributes ?? {};
                  const coords = collectingEvent?.attributes?.eventGeom;
                  const group = attributes.group;
                  const sampleName = attributes.materialSampleName;
                  // Return point or null if required fields missing
                  return coords && id
                    ? {
                        attributes: {
                          sampleID: id,
                          count: 1,
                          group: group,
                          sampleName: sampleName
                        },
                        coordinates: coords
                      }
                    : null;
                })
                .filter(Boolean);

              updateMapPoints(points);
            } else {
              // Above threshold: use geotile aggregation for clustering
              const response = await apiClient.axios.post(
                "search-api/search-ws/search",
                {
                  size: 0,
                  query,
                  // Aggregate data into geographic tiles based on zoom level
                  aggs: {
                    included_events: {
                      nested: {
                        path: "included"
                      },
                      aggs: {
                        event_type: {
                          filter: {
                            term: {
                              "included.type": "collecting-event"
                            }
                          },
                          aggs: {
                            by_tile: {
                              // Use geotile_grid for geographic clustering
                              geotile_grid: {
                                field: "included.attributes.eventGeom",
                                precision: zoomToPrecision(zoom), // Precision scales with zoom
                                bounds: {
                                  top_left: {
                                    lat: topleft[1],
                                    lon: topleft[0]
                                  },
                                  bottom_right: {
                                    lat: bottomright[1],
                                    lon: bottomright[0]
                                  }
                                }
                              },
                              // Calculate centroid for each tile
                              aggs: {
                                centroid: {
                                  geo_centroid: {
                                    field: "included.attributes.eventGeom"
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
              // Extract aggregation buckets from response
              const buckets =
                response.data.aggregations["nested#included_events"][
                  "filter#event_type"
                ]["geotile_grid#by_tile"]?.buckets ?? [];

              // Convert buckets to map points with cluster info
              const points = buckets
                .filter((bucket) => bucket["geo_centroid#centroid"]?.location)
                .map((bucket) => {
                  // Use centroid location and document count from bucket
                  const doc_count = bucket.doc_count;
                  const { lat, lon } = bucket["geo_centroid#centroid"].location;
                  return {
                    coordinates: [lon, lat],
                    attributes: { count: doc_count, tileKey: bucket.key } // count is cluster size
                  };
                });

              updateMapPoints(points);
            }
          } catch (error) {
            console.error("Error fetching data within extent:", error);
            updateMapPoints([]); // Clear points on error
          }
        }

        viewRef.current = mapViewInstance;

        // Watch for extent changes and fetch data with debouncing
        // Debouncing prevents excessive API calls while user is panning/zooming
        watchHandle = mapViewInstance.watch("extent", (extent) => {
          if (debounceTimer) clearTimeout(debounceTimer);
          debounceTimer = setTimeout(() => {
            fetchDataWithinExtent(extent);
          }, debounceDelay) as any;
        }) as any;
      }
    );

    // Cleanup: remove watchers and timers when component unmounts
    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      if (watchHandle) (watchHandle as any).remove();
    };
  }, []);

  // Render map container with fixed height
  return (
    <div
      className="mt-2 mb-4 w-100 rounded-2 overflow-hidden"
      style={{
        height: "350px",
        background: "#f2f2f2" // Loading background color
      }}
    >
      {/* Map element mounted here by ArcGIS MapView */}
      <div ref={mapRef} className="w-100 h-100" />
    </div>
  );
}
