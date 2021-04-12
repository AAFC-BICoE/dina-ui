import { KitsuResource } from "kitsu";

interface SRSAttributes {
  srs: string[];
}

export type SRS = KitsuResource & SRSAttributes;
