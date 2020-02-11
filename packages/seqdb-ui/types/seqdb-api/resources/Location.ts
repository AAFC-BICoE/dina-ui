import { KitsuResource } from "kitsu";
import { Container } from "./Container";
import { PcrPrimer } from "./PcrPrimer";
import { Sample } from "./Sample";

export interface LocationAttributes {
  dateMoved?: string;
  lastModified?: string;
  wellColumn?: number;
  wellRow?: number;
}

export interface LocationRelationships {
  container: Container;
  sample?: Sample;
  pcrPrimer?: PcrPrimer;
}

export type Location = KitsuResource &
  LocationAttributes &
  LocationRelationships;
