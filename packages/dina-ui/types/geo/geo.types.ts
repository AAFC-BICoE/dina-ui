export type GeoPosition = [longitude: number, latitude: number];

export type GeoPolygon = {
  type: "Polygon";
  coordinates: GeoPosition[][];
};
