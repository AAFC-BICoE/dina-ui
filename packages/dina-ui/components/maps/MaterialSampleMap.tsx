import { useEffect, useRef } from "react";
import { getMapModules } from "../../utils/geoUtils";
import { useApiClient } from "common-ui";

function zoomToPrecision(zoom) {
  if (zoom >= 12) return 15;
  if (zoom >= 9) return 13;
  if (zoom >= 7) return 10;
  if (zoom >= 6) return 8;
  if (zoom >= 5) return 6;
  if (zoom >= 3) return 4;
  return 3;
}

export default function MaterialSampleMap(totalRecords) {
  const mapRef = useRef(null);
  const viewRef = useRef(null);
  const featureLayerRef = useRef<any>(null);
  const { apiClient } = useApiClient();

  const CLUSTER_THRESHOLD = 500; // threshold to switch between raw points and clusters

  useEffect(() => {
    if (!mapRef.current) return;
    let watchHandle = null;
    let debounceTimer = null;
    const DEBOUNCE_DELAY = 250; // ms

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
        const layer = new FeatureLayer({
          source: [],
          objectIdField: "ObjectID",
          geometryType: "point",
          spatialReference: { wkid: 4326 },
          outFields: ["*"],
          fields: [
            { name: "ObjectID", type: "oid" },
            { name: "count", type: "integer" },
            { name: "sampleID", type: "string" },
            { name: "tileKey", type: "string" },
            { name: "sampleName", type: "string" },
            { name: "group", type: "string" }
          ],
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
                maxDataValue: totalRecords ?? 1000,
                minSize: 10,
                maxSize: 30
              }
            ]
          },
          labelingInfo: [
            {
              labelExpressionInfo: { expression: "$feature.count" },
              where: "count > 1", // Only clusters
              symbol: {
                type: "text",
                color: "black",
                haloColor: "white",
                haloSize: 1,
                font: { size: 12, weight: "bold" }
              },
              labelPlacement: "center-center"
            }
          ],
          popupTemplate: {
            title: "{count} sample(s) here",
            outFields: ["*"],
            content: (feature) => {
              const div = document.createElement("div");

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
                div.innerHTML = `Cluster of ${feature.graphic.attributes.count} samples`;
              }

              return div;
            }
          }
        });
        featureLayerRef.current = layer;

        const map = new Map({
          basemap: "streets-vector",
          layers: [layer]
        });

        const mapViewInstance = new MapView({
          container: mapRef.current,
          map,
          center: [-95, 40],
          zoom: 4,
          highlightOptions: {
            color: [226, 119, 40],
            haloOpacity: 0,
            fillOpacity: 0
          }
        });

        // Map layer toggle
        const basemapToggle = new BasemapToggle({
          view: mapViewInstance,
          nextBasemap: "hybrid"
        });
        mapViewInstance.ui.add(basemapToggle, "bottom-right");

        // Scalebar
        const scaleBar = new ScaleBar({
          view: mapViewInstance,
          unit: "metric"
        });
        mapViewInstance.ui.add(scaleBar, "bottom-left");

        // Fullscreen button
        const fullscreen = new Fullscreen({
          view: mapViewInstance
        });
        mapViewInstance.ui.add(fullscreen, "top-right");

        async function updateMapPoints(points) {
          // Prepare new graphics
          const graphics = points.map(
            (pt) =>
              new Graphic({
                geometry: {
                  type: "point",
                  longitude: pt.coordinates[0],
                  latitude: pt.coordinates[1],
                  spatialReference: { wkid: 4326 }
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

          // First clear, then add
          featureLayerRef.current.queryFeatures().then((result) => {
            featureLayerRef.current.applyEdits({
              deleteFeatures: result.features, // ✅ actual feature objects
              addFeatures: graphics
            });
          });
        }

        async function fetchDataWithinExtent(extent) {
          const zoom = (viewRef.current as any).zoom;

          if (extent.spatialReference.isWebMercator) {
            extent = webMercatorUtils.webMercatorToGeographic(extent);
          }
          // Already WGS84
          else if (extent.spatialReference.wkid === 4326) {
            extent = extent;
          }
          // Other projections - use projection engine
          else {
            extent = projection.project(extent, { wkid: 4326 });
          }

          const topleft = [extent.xmin.toFixed(8), extent.ymax.toFixed(8)];
          const bottomright = [extent.xmax.toFixed(8), extent.ymin.toFixed(8)];

          try {
            // COUNT FIRST
            const count_response = await apiClient.axios.post(
              "search-api/search-ws/search",
              {
                size: 0,
                query: {
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
                }
              },
              { params: { indexName: "dina_material_sample_index" } }
            );
            const total_count = count_response.data.hits.total.value;

            featureLayerRef.current.renderer = {
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
                  maxDataValue: total_count,
                  minSize: 10,
                  maxSize: 30
                }
              ]
            };

            if (total_count < CLUSTER_THRESHOLD) {
              // --- RAW POINTS ---
              const points_response = await apiClient.axios.post(
                "search-api/search-ws/search",
                {
                  size: 5000,
                  query: {
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
                                    term: {
                                      "included.type": "collecting-event"
                                    }
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
                  },
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

              const hits = points_response.data.hits.hits;
              const points = hits
                .map((doc) => {
                  const id = doc._id;
                  const includedArr = doc._source?.included ?? [];
                  const collectingEvent = includedArr.find(
                    (e) =>
                      e.type === "collecting-event" &&
                      Array.isArray(e.attributes?.eventGeom)
                  );

                  const attributes = doc._source?.data?.attributes ?? {};
                  const coords = collectingEvent?.attributes?.eventGeom;
                  const group = attributes.group;
                  const sampleName = attributes.materialSampleName;
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
              // --- AGGREGATIONS / CLUSTERS ---
              const response = await apiClient.axios.post(
                "search-api/search-ws/search",
                {
                  size: 0,
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
                              geotile_grid: {
                                field: "included.attributes.eventGeom",
                                precision: zoomToPrecision(zoom),
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
              const buckets =
                response.data.aggregations["nested#included_events"][
                  "filter#event_type"
                ]["geotile_grid#by_tile"]?.buckets ?? [];

              const points = buckets
                .filter((bucket) => bucket["geo_centroid#centroid"]?.location)
                .map((bucket) => {
                  const doc_count = bucket.doc_count;
                  const { lat, lon } = bucket["geo_centroid#centroid"].location;
                  return {
                    coordinates: [lon, lat],
                    attributes: { count: doc_count, tileKey: bucket.key }
                  };
                });

              updateMapPoints(points);
            }
          } catch (error) {
            console.error("Error fetching data within extent:", error);
            updateMapPoints([]); // clear points if error
          }
        }

        viewRef.current = mapViewInstance;

        // Debounced extent watcher
        watchHandle = mapViewInstance.watch("extent", (extent) => {
          if (debounceTimer) clearTimeout(debounceTimer);
          debounceTimer = setTimeout(() => {
            fetchDataWithinExtent(extent);
          }, DEBOUNCE_DELAY) as any;
        }) as any;
      }
    );

    // Cleanup function on unmount
    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      if (watchHandle) (watchHandle as any).remove();
    };
  }, []);

  return (
    <div
      className="mt-2 mb-4 w-100 rounded-2 overflow-hidden"
      style={{
        height: "350px",
        background: "#f2f2f2"
      }}
    >
      <div ref={mapRef} className="w-100 h-100" />
    </div>
  );
}
