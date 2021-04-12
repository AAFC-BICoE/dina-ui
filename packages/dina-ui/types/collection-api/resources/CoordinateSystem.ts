import { KitsuResource } from "kitsu";

interface CoordinateSystemAttributes {
  id: string;
  coordinateSystem: string[];
}

export type CoordinateSystem = KitsuResource & CoordinateSystemAttributes;
