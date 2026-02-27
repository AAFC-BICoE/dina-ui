import { loadModules } from "esri-loader";
import type { GeoPosition } from "packages/dina-ui/types/geo/geo.types";

/**
 * Internal cached ArcGIS map modules and projection modules
 */
let mapModulesPromise: Promise<{
  Map: any;
  MapView: any;
  GraphicsLayer: any;
  SketchViewModel: any;
  Graphic: any;
}> | null = null;

/**
 * Load and cache ArcGIS map modules (only once)
 */
export async function getMapModules() {
  if (!mapModulesPromise) {
    mapModulesPromise = loadModules(
      [
        "esri/Map",
        "esri/views/MapView",
        "esri/layers/GraphicsLayer",
        "esri/widgets/Sketch/SketchViewModel",
        "esri/Graphic"
      ],
      { css: false }
    ).then(([Map, MapView, GraphicsLayer, SketchViewModel, Graphic]) => ({
      Map,
      MapView,
      GraphicsLayer,
      SketchViewModel,
      Graphic
    }));
  }

  return mapModulesPromise;
}

let projectionModulesPromise: Promise<{
  Polygon: any;
  projection: any;
  SpatialReference: any;
}> | null = null;

/**
 * Load and cache ArcGIS projection modules (only once)
 */
async function getProjectionModules() {
  if (!projectionModulesPromise) {
    projectionModulesPromise = loadModules([
      "esri/geometry/Polygon",
      "esri/geometry/projection",
      "esri/geometry/SpatialReference"
    ]).then(async ([Polygon, projection, SpatialReference]) => {
      // Load projection engine ONCE
      await projection.load();

      return { Polygon, projection, SpatialReference };
    });
  }

  return projectionModulesPromise;
}

/**
 * Convert a polygon from 3857 to 4326
 * @param rings The polygon rings in Web Mercator (3857)
 * @returns The polygon rings in WGS84 (4326)
 */
export async function projectPolygon3857To4326(
  rings: number[][][]
): Promise<GeoPosition[][]> {
  const { Polygon, projection, SpatialReference } =
    await getProjectionModules();

  const polygon3857 = new Polygon({
    rings,
    spatialReference: new SpatialReference({ wkid: 3857 })
  });

  const polygon4326 = projection.project(
    polygon3857,
    new SpatialReference({ wkid: 4326 })
  );

  if (!polygon4326) {
    throw new Error(`Projection failed from WKID ${3857} to WKID ${4326}`);
  }

  return polygon4326.rings as GeoPosition[][];
}
