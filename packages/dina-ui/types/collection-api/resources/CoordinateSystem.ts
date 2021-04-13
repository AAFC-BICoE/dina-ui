import { KitsuResource } from "kitsu";

interface CoordinateSystemAttributes {
  coordinateSystem: string[];
}

export type CoordinateSystem = KitsuResource & CoordinateSystemAttributes;
