export type GeoPosition = [number, number];

export type GeoPolygon = {
  type: "Polygon";
  coordinates: GeoPosition[][];
};
