import { useEffect, useRef, useState } from "react";
import GeometryMapEditor from "packages/dina-ui/components/geo/GeometryMapEditor";
import { PostMessageType } from "packages/dina-ui/types/geo/post-message.types";
import { POLYGON_EDITOR_MODE } from "packages/dina-ui/types/geo/polygon-editor-mode.types";
import type { PolygonEditorMode } from "packages/dina-ui/types/geo/polygon-editor-mode.types";
import type {
  GeoPosition,
  GeoPolygon
} from "packages/dina-ui/types/geo/geo.types";
import {
  getMapModules,
  projectPolygon3857To4326
} from "packages/dina-ui/utils/geoUtils";

type Props = {
  polygon?: GeoPolygon | null;
  mode?: PolygonEditorMode;
};

export function PolygonEditorMap({ polygon, mode }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const sketchRef = useRef<any>(null);
  const [graphicsLayer, setGraphicsLayer] = useState<any>(null);
  const [polygonRings, setPolygonRings] = useState<GeoPosition[][]>(
    polygon?.coordinates ?? []
  );

  useEffect(() => {
    if (!mapRef.current) return;

    let viewInstance: any;

    getMapModules().then(
      ({ Map, MapView, GraphicsLayer, SketchViewModel, Graphic }) => {
        const layer = new GraphicsLayer();
        setGraphicsLayer(layer);

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

        if (polygon?.coordinates && polygon.coordinates.length) {
          const graphic = new Graphic({
            geometry: {
              type: "polygon",
              rings: polygon.coordinates,
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

        if (mode === POLYGON_EDITOR_MODE.CREATE) {
          sketch.create("polygon");
        }

        sketch.on("create", () => {});
        sketch.on("update", () => {});

        layer.watch("graphics.length", () => {
          if (layer.graphics.length > 0) {
            const rings = layer.graphics.getItemAt(0)?.geometry?.rings ?? [];
            setPolygonRings(rings);
          } else {
            setPolygonRings([]);
          }
        });
      }
    );

    return () => {
      if (viewInstance) {
        viewInstance.destroy();
      }
    };
  }, [polygon, mode]);

  const handleErase = () => {
    if (!graphicsLayer || !sketchRef.current) return;

    sketchRef.current.cancel();
    graphicsLayer.removeAll();

    if (mode !== POLYGON_EDITOR_MODE.VIEW) {
      sketchRef.current.create("polygon");
    }
  };

  const handleSave = async () => {
    if (!graphicsLayer || !sketchRef.current) return;

    // Finish any active drawing/edit
    if (sketchRef.current.state === "active") {
      sketchRef.current.complete();
    }

    let coordinates: GeoPosition[][] = [];

    if (graphicsLayer.graphics.length > 0) {
      const graphic = graphicsLayer.graphics.getItemAt(0);

      if (
        graphic?.geometry?.rings?.length &&
        graphic.geometry?.rings[0].length > 2
      ) {
        // exclude points
        coordinates = await projectPolygon3857To4326(graphic.geometry.rings);
      }
    }

    if (window.opener && !window.opener.closed) {
      window.opener.postMessage(
        {
          type:
            mode === POLYGON_EDITOR_MODE.CREATE
              ? PostMessageType.PolygonCreated
              : PostMessageType.PolygonEdited,
          coordinates
        },
        window.location.origin
      );
    }

    window.close();
  };

  return mode === POLYGON_EDITOR_MODE.VIEW ? (
    <GeometryMapEditor mapRef={mapRef} />
  ) : (
    <GeometryMapEditor
      mapRef={mapRef}
      buttons={["save", "erase"]}
      coordinates={polygonRings}
      handleSave={handleSave}
      handleErase={handleErase}
    />
  );
}
