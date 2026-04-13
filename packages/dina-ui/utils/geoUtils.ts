import { loadModules } from "esri-loader";
import type { GeoPosition } from "packages/dina-ui/types/geo/geo.types";

/**
 * Internal cached ArcGIS map modules and projection modules.
 * Once we upgrade to use @arcgis/core, we can improve type safety.
 */
let mapModulesPromise: Promise<{
  Map: any;
  MapView: any;
  GraphicsLayer: any;
  SketchViewModel: any;
  Graphic: any;
  BasemapToggle: any;
  Search: any;
  ScaleBar: any;
  Fullscreen: any;
}> | null = null;

/**
 * Load and cache ArcGIS map modules (only once)
 */
export async function getMapModules() {
  if (!mapModulesPromise) {
    mapModulesPromise = loadModules([
      "esri/Map",
      "esri/views/MapView",
      "esri/layers/GraphicsLayer",
      "esri/widgets/Sketch/SketchViewModel",
      "esri/Graphic",
      "esri/widgets/BasemapToggle",
      "esri/widgets/Search",
      "esri/widgets/ScaleBar",
      "esri/widgets/Fullscreen"
    ]).then(
      ([
        Map,
        MapView,
        GraphicsLayer,
        SketchViewModel,
        Graphic,
        BasemapToggle,
        Search,
        ScaleBar,
        Fullscreen
      ]) => ({
        Map,
        MapView,
        GraphicsLayer,
        SketchViewModel,
        Graphic,
        BasemapToggle,
        Search,
        ScaleBar,
        Fullscreen
      })
    );
  }

  return mapModulesPromise;
}

// Singleton cache
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
    ])
      .then(async ([Polygon, projection, SpatialReference]) => {
        await projection.load();
        return { Polygon, projection, SpatialReference };
      })
      .catch((err) => {
        projectionModulesPromise = null; // allow retry
        throw err;
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

// An empty polygon ([]) is considered valid
export function validatePolygon(polygon: GeoPosition[][]): boolean {
  if (!Array.isArray(polygon)) {
    return false;
  }

  for (let i = 0; i < polygon.length; i++) {
    const ring = polygon[i];

    if (!Array.isArray(ring) || ring.length < 4) {
      return false;
    }

    for (const pos of ring) {
      if (
        !Array.isArray(pos) ||
        pos.length !== 2 ||
        typeof pos[0] !== "number" ||
        typeof pos[1] !== "number" ||
        !isFinite(pos[0]) ||
        !isFinite(pos[1])
      ) {
        return false;
      }

      const [lng, lat] = pos;

      if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
        return false;
      }
    }

    const first = ring[0];
    const last = ring[ring.length - 1];

    if (first[0] !== last[0] || first[1] !== last[1]) {
      return false;
    }
  }

  return true;
}
