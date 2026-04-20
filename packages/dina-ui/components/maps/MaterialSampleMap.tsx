import { useEffect, useRef } from "react";
import { getMapModules } from "../../utils/geoUtils";
import { useApiClient } from "common-ui";

function projectPoint3857To4326(x, y) {
  const R2D = 180 / Math.PI;
  const A = 6378137;
  const lon = (x / A) * R2D;
  const lat = (2 * Math.atan(Math.exp(y / A)) - Math.PI / 2) * R2D;
  return [lon, lat];
}

function zoomToPrecision(zoom) {
  if (zoom >= 15) return 8;
  if (zoom >= 12) return 7;
  if (zoom >= 9) return 6;
  if (zoom >= 6) return 5;
  if (zoom >= 3) return 4;
  return 3;
}

export default function MaterialSampleMap(totalRecords) {
  const mapRef = useRef(null);
  const viewRef = useRef(null);
  const featureLayerRef = useRef<any>(null);
  const { apiClient } = useApiClient();

  useEffect(() => {
    if (!mapRef.current) return;
    let watchHandle = null;
    let debounceTimer = null;
    const DEBOUNCE_DELAY = 100;

    getMapModules().then(({ Map, MapView, FeatureLayer, Graphic }) => {
      const layer = new FeatureLayer({
        source: [],
        objectIdField: "ObjectID",
        geometryType: "point",
        spatialReference: { wkid: 4326 },
        fields: [
          { name: "ObjectID", type: "oid" },
          { name: "count", type: "integer" },
          { name: "sample_id", type: "string" },
          { name: "tile_key", type: "string" }
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
          content: (feature) => {
            if (feature.graphic.attributes.count === 1) {
              return `Sample ID: ${feature.graphic.attributes.sample_id || ""}`;
            } else {
              return `Cluster of ${feature.graphic.attributes.count} samples`;
            }
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

      async function updateMapPoints(points) {
        const graphics = points.map(
          (pt, i) =>
            new Graphic({
              geometry: {
                type: "point",
                longitude: pt.coordinates[0],
                latitude: pt.coordinates[1],
                spatialReference: { wkid: 4326 }
              },
              attributes: {
                ObjectID: i,
                count: pt.attributes?.count ?? 1, // always present
                sample_id: pt.attributes?.sample_id,
                tile_key: pt.attributes?.tile_key
              }
            })
        );
        if (featureLayerRef.current) {
          await featureLayerRef.current.applyEdits({
            deleteFeatures: featureLayerRef.current.source.items,
            addFeatures: graphics
          });
        }
      }

      async function fetchDataWithinExtent(extent) {
        const { xmin, ymin, xmax, ymax } = extent;
        const topleft = projectPoint3857To4326(xmin, ymax);
        const bottomright = projectPoint3857To4326(xmax, ymin);
        const zoom = mapViewInstance.zoom;

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
                              { term: { "included.type": "collecting-event" } }
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

          if (total_count < 5000) {
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
                },
                _source: {
                  includes: [
                    "data.id",
                    "included.attributes.eventGeom",
                    "included.type"
                  ]
                }
              },
              { params: { indexName: "dina_material_sample_index" } }
            );

            const hits = points_response.data.hits.hits;
            const points = hits
              .map((doc) => {
                const id = doc._source?.data?.id;
                const includedArr = doc._source?.included ?? [];
                const collectingEvent = includedArr.find(
                  (e) =>
                    e.type === "collecting-event" &&
                    Array.isArray(e.attributes?.eventGeom)
                );
                const coords = collectingEvent?.attributes?.eventGeom;
                return coords && id
                  ? {
                      attributes: { sample_id: id, count: 1 },
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
                                top_left: { lat: topleft[1], lon: topleft[0] },
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
                  attributes: { count: doc_count, tile_key: bucket.key }
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
    });

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
