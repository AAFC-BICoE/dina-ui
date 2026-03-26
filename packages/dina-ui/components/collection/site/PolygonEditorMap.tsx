import { useEffect, useRef, useState } from "react";
import ArcGISLoader from "../../geo/ArcGISLoader";
import { POLYGON_EDITOR_MODE } from "packages/dina-ui/types/geo/polygon-editor-mode.types";
import {
  getMapModules,
  projectPolygon3857To4326
} from "packages/dina-ui/utils/geoUtils";
import type { PolygonEditorMode } from "packages/dina-ui/types/geo/polygon-editor-mode.types";
import type { GeoPosition } from "packages/dina-ui/types/geo/geo.types";

export default function PolygonEditorMap({
  coords,
  mode,
  onCoordsChange
}: {
  coords: GeoPosition[][];
  mode?: PolygonEditorMode;
  onCoordsChange: (coords: GeoPosition[][]) => void;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const sketchRef = useRef<any>(null);
  const [graphicsLayer, setGraphicsLayer] = useState<any>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    let viewInstance: any;

    getMapModules().then(
      ({ Map, MapView, GraphicsLayer, SketchViewModel, Graphic }) => {
        const layer = new GraphicsLayer();
        setGraphicsLayer(layer);

        const map = new Map({
          basemap: "streets-vector",
          layers: [layer]
        });

        viewInstance = new MapView({
          container: mapRef.current as HTMLDivElement,
          map,
          center: [-95, 40],
          zoom: 4,
          highlightOptions: {
            color: [226, 119, 40],
            haloOpacity: 0,
            fillOpacity: 0
          }
        });

        const polygonSymbol = {
          type: "simple-fill",
          color: [226, 119, 40, 0.2],
          outline: {
            color: [226, 119, 40],
            width: 2
          }
        };

        const sketch = new SketchViewModel({
          view: viewInstance,
          layer,
          updateOnGraphicClick: mode === POLYGON_EDITOR_MODE.EDIT,
          polygonSymbol
        });
        sketchRef.current = sketch;

        if (coords?.length) {
          const graphic = new Graphic({
            geometry: {
              type: "polygon",
              rings: coords,
              spatialReference: { wkid: 4326 }
            },
            symbol: polygonSymbol
          });

          layer.add(graphic);

          viewInstance.when().then(() => {
            viewInstance.goTo(graphic);

            if (mode === POLYGON_EDITOR_MODE.EDIT) {
              sketch.update(graphic);
            }
          });
        } else if (mode === POLYGON_EDITOR_MODE.EDIT) {
          sketch.create("polygon");
        }
      }
    );

    return () => {
      viewInstance?.destroy();
    };
  }, []);

  useEffect(() => {
    if (!graphicsLayer) return;

    const updateCoords = async () => {
      const graphic = graphicsLayer.graphics.getItemAt(0);

      if (graphic) {
        onCoordsChange(await projectPolygon3857To4326(graphic.geometry.rings));
      } else {
        onCoordsChange([]);
        sketchRef.current?.create("polygon");
      }
    };

    const updateHandle = sketchRef.current?.on("update", updateCoords);
    const changeHandle = graphicsLayer.graphics.on("change", updateCoords);

    return () => {
      updateHandle?.remove();
      changeHandle?.remove();
    };
  }, [graphicsLayer]);

  return (
    <ArcGISLoader>
      <div
        className="mt-2 mb-4 w-100 rounded-2 overflow-hidden"
        style={{
          height: "350px",
          background: "#f2f2f2"
        }}
      >
        <div ref={mapRef} className="w-100 h-100" />
      </div>
    </ArcGISLoader>
  );
}
