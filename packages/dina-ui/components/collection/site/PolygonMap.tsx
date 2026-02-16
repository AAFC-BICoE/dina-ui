import { useEffect, useRef } from "react";
import { loadModules } from "esri-loader";
import type { GeoPolygon } from "packages/dina-ui/types/geo/geopolygon";

export function PolygonMap({ geopolygon }: { geopolygon: GeoPolygon }) {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    let view: any;

    const initMap = async () => {
      const [Map, MapView, Graphic, GraphicsLayer, Polygon] = await loadModules(
        [
          "esri/Map",
          "esri/views/MapView",
          "esri/Graphic",
          "esri/layers/GraphicsLayer",
          "esri/geometry/Polygon"
        ]
      );

      const graphicsLayer = new GraphicsLayer();

      const map = new Map({
        basemap: "dark-gray-vector",
        layers: [graphicsLayer]
      });

      view = new MapView({
        container: mapRef.current,
        map,
        center: geopolygon.coordinates[0][0],
        zoom: 12
      });

      // Convert GeoJSON coordinates to ArcGIS rings
      const polygon = new Polygon({
        rings: geopolygon.coordinates,
        spatialReference: { wkid: 4326 }
      });

      const polygonGraphic = new Graphic({
        geometry: polygon,
        symbol: {
          type: "simple-fill",
          color: [226, 119, 40, 0.2],
          outline: {
            color: [226, 119, 40],
            width: 2
          }
        }
      });

      graphicsLayer.add(polygonGraphic);

      // Zoom to polygon
      await view.when();
      view.goTo(polygon);
    };

    initMap();

    return () => {
      if (view) {
        view.destroy();
      }
    };
  }, [geopolygon]);

  return <div ref={mapRef} style={{ height: "500px", width: "100%" }} />;
}
