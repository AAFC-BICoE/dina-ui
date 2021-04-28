import { KitsuResource } from "kitsu";

interface CoordinateSystemAttributes {
  coordinateSystem: string[];
}

export enum CoordinateSystemEnum {
  DECIMAL_DEGREE = "decimal degrees",
  DEGREE_DECIMAL_MINUTES = "degrees decimal minutes",
  DEGREE_MINUTES_SECONDS = "degrees minutes seconds",
  UTM = "UTM"
}

export const CoordinateSystemEnumPlaceHolder = {
  "decimal degrees": "0.0000°",
  "degrees decimal minutes": "00°00.00′",
  "degrees minutes seconds": "00°00′00″",
  UTM: "Enter UTM grid coordinates"
};

export enum GeoreferenceVerificationStatus {
  GEOREFERENCING_NOT_POSSIBLE = "GEOREFERENCING_NOT_POSSIBLE"
}

export type CoordinateSystem = KitsuResource & CoordinateSystemAttributes;
