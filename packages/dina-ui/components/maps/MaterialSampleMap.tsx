import { useEffect, useRef } from "react";
import { getMapModules } from "../../utils/geoUtils";
import { useApiClient } from "common-ui";
import { v4 as uuidv4 } from "uuid";

// Converts XYZ tile to lon/lat
// function tileToLonLat(z: number, x: number, y: number) {
//   const n = Math.pow(2, z);
//   const lon_deg = (x + 0.5) / n * 360.0 - 180.0;
//   const lat_rad = Math.atan(Math.sinh(Math.PI * (1 - 2 * (y + 0.5) / n)));
//   const lat_deg = lat_rad * 180.0 / Math.PI;
//   return [lon_deg, lat_deg]; // [longitude, latitude]
// }

function zoomToPrecision(zoom: number) {
  if (zoom >= 15) return 8; // ~10m
  if (zoom >= 12) return 7; // ~76m
  if (zoom >= 9) return 6; // ~610m
  if (zoom >= 6) return 5; // ~4.9km
  if (zoom >= 3) return 4; // ~39km
  return 3; // ~156km
}

export default function MaterialSampleMap() {
  const mapRef = useRef(null);
  const viewRef = useRef(null);
  const featureLayerRef = useRef<any>(null);

  const { apiClient } = useApiClient();

  useEffect(() => {
    if (!mapRef.current) return;
    let watchHandle: any = null;
    let debounceTimer: NodeJS.Timeout | null = null;
    const DEBOUNCE_DELAY = 10; // ms

    getMapModules().then(({ Map, MapView, FeatureLayer, Graphic }) => {
      // Initial FeatureLayer with no data
      const layer = new FeatureLayer({
        source: [], // will set this later
        objectIdField: "ObjectID",
        geometryType: "point",
        spatialReference: { wkid: 4326 },
        fields: [
          { name: "ObjectID", type: "oid" },
          { name: "count", type: "integer" }
        ],
        renderer: {
          type: "simple",
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
              maxDataValue: 1000000,
              minSize: 10,
              maxSize: 70
            }
          ]
        },
        labelingInfo: [
          {
            labelExpressionInfo: { expression: "$feature.count" },
            symbol: {
              type: "text",
              color: "black",
              haloColor: "white",
              haloSize: 1,
              font: { size: 12, weight: "bold" }
            },
            labelPlacement: "center-center"
          }
        ]
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

      function updateMapPoints(points) {
        // Convert input to Graphics with a unique ObjectID
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
                ObjectID: uuidv4(), // unique!
                count: pt.attributes?.count ?? 0
              }
            })
        );

        featureLayerRef.current.source = graphics;
      }

      async function fetchDataWithinExtent() {
        // const { xmin, ymin, xmax, ymax } = extent;
        // const topleft = projectPoint3857To4326(xmin, ymax);
        // const bottomright = projectPoint3857To4326(xmax, ymin);

        const zoom = mapViewInstance.zoom;

        try {
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
                            precision: zoomToPrecision(zoom)
                            // "bounds": {
                            //   "top_left": {
                            //     "lat": topleft[1],
                            //     "lon": topleft[0]
                            //   },
                            //   "bottom_right": {
                            //     "lat": bottomright[1],
                            //     "lon": bottomright[0]
                            //   }
                            // }
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

          if (buckets.length > 0) {
            const points = buckets.map((bucket) => {
              const doc_count = bucket.doc_count;
              const { lat, lon } = bucket["geo_centroid#centroid"]?.location;
              return {
                coordinates: [lon, lat],
                attributes: { count: doc_count },
                id: bucket.key // use tile key as unique ID
              };
            });
            updateMapPoints(points);
          }
        } catch (error) {
          console.error("Error fetching data within extent:", error);
        }
      }

      viewRef.current = mapViewInstance;

      // mapViewInstance.when(() => {
      //   fetchDataWithinExtent(mapViewInstance.extent);
      // });

      // Debounced extent watcher
      watchHandle = mapViewInstance.watch("extent", () => {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          fetchDataWithinExtent();
        }, DEBOUNCE_DELAY);
      });
    });

    // Cleanup function on unmount
    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      if (watchHandle) watchHandle.remove();
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
