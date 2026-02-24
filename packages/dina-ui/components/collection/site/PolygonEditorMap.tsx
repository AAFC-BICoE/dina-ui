import { useEffect, useRef, useState } from "react";
import { loadModules } from "esri-loader";
import GeometryMapEditor from "packages/dina-ui/components/geo/GeometryMapEditor";
import { PostMessageType } from "packages/dina-ui/types/geo/post-message.types";
import { POLYGON_EDITOR_MODE } from "packages/dina-ui/types/geo/polygon-editor-mode.types";
import type { PolygonEditorMode } from "packages/dina-ui/types/geo/polygon-editor-mode.types";
import type {
  GeoPosition,
  GeoPolygon
} from "packages/dina-ui/types/geo/geo.types";

type PolygonEditorMapProps = {
  polygon?: GeoPolygon | null;
  mode?: PolygonEditorMode;
};

export function PolygonEditorMap({
  polygon,
  mode = POLYGON_EDITOR_MODE.CREATE
}: PolygonEditorMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const sketchRef = useRef<any>(null);
  const [graphicsLayer, setGraphicsLayer] = useState<any>(null);
  const [polygonRings, setPolygonRings] = useState<GeoPosition[][] | null>(
    polygon?.coordinates ?? null
  );

  useEffect(() => {
    if (!mapRef.current) return;

    let viewInstance: any;

    loadModules(
      [
        "esri/Map",
        "esri/views/MapView",
        "esri/layers/GraphicsLayer",
        "esri/widgets/Sketch/SketchViewModel",
        "esri/Graphic"
      ],
      { css: false }
    ).then(([Map, MapView, GraphicsLayer, SketchViewModel, Graphic]) => {
      const layer = new GraphicsLayer();

      const map = new Map({
        basemap: "dark-gray-vector",
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

      // Render existing polygon (view + edit)
      if (polygon?.coordinates) {
        const graphic = new Graphic({
          geometry: {
            type: "polygon",
            rings: polygon.coordinates,
            spatialReference: { wkid: 4326 }
          },
          symbol: polygonSymbol
        });

        layer.add(graphic);

        viewInstance.when(() => {
          viewInstance.goTo(graphic);
        });

        if (mode === POLYGON_EDITOR_MODE.EDIT) {
          sketch.update(graphic);
        }
      }

      // Create mode only
      if (mode === POLYGON_EDITOR_MODE.CREATE) {
        sketch.create("polygon");
      }

      sketch.on("create", (event: any) => {
        if (event.state === "complete") {
          setPolygonRings(event.graphic.geometry.rings);
        }
      });

      sketch.on("update", (event: any) => {
        if (event.state === "complete") {
          setPolygonRings(event.graphics[0].geometry.rings);
          sketch.cancel();
        }
      });

      setGraphicsLayer(layer);
    });

    return () => {
      if (viewInstance) {
        viewInstance.destroy();
      }
    };
  }, [polygon, mode]);

  const handleErase = () => {
    if (!graphicsLayer || !sketchRef.current) return;
    if (mode === POLYGON_EDITOR_MODE.VIEW) return;

    // Stop any active operation
    sketchRef.current.cancel();

    // Clear graphics
    graphicsLayer.removeAll();
    setPolygonRings(null);

    // Restart polygon drawing (both CREATE and EDIT)
    sketchRef.current.create("polygon");
  };

  const handleSave = () => {
    if (!polygonRings || mode === POLYGON_EDITOR_MODE.VIEW) return;

    if (window.opener && !window.opener.closed) {
      window.opener.postMessage(
        {
          type:
            mode === POLYGON_EDITOR_MODE.CREATE
              ? PostMessageType.PolygonCreated
              : PostMessageType.PolygonEdited,
          coordinates: polygonRings
        },
        window.location.origin
      );
    }

    window.close();
  };

  return mode === POLYGON_EDITOR_MODE.VIEW ? (
    <GeometryMapEditor mapRef={mapRef} buttons={["close"]} />
  ) : (
    <GeometryMapEditor
      mapRef={mapRef}
      buttons={["save", "erase", "close"]}
      handleSave={handleSave}
      coordinates={polygonRings}
      handleErase={handleErase}
    />
  );
}
