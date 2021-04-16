import { KitsuResource } from "kitsu";

interface SRSAttributes {
  srs: string[];
}

export enum SRSEnum {
  WGS84 = "WGS84 (EPSG:4326)",
  NAD27 = "NAD27 (EPSG:4276)"
}

export type SRS = KitsuResource & SRSAttributes;
