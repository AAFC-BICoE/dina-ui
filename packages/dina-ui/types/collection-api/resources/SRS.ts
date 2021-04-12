import { KitsuResource } from "kitsu";

interface SRSAttributes {
  id: string;
  srs: string[];
}

export type SRS = KitsuResource & SRSAttributes;
