import { KitsuResource } from "kitsu";
import { Region } from "./Region";

export interface PcrProfileAttributes {
  name: string;
  // Optional fields
  group?: string;
  cycles?: string | null;
  lastModified?: string | null;
  application?: string | null;
  steps?: string[];
  // step1?: string | null;
  // step2?: string | null;
  // step3?: string | null;
  // step4?: string | null;
  // step5?: string | null;
  // step6?: string | null;
  // step7?: string | null;
  // step8?: string | null;
  // step9?: string | null;
  // step10?: string | null;
  // step11?: string | null;
  // step12?: string | null;
  // step13?: string | null;
  // step14?: string | null;
  // step15?: string | null;
}

export interface PcrProfileRelationships {
  region?: Region;
}

export type PcrProfile = KitsuResource &
  PcrProfileAttributes &
  PcrProfileRelationships;
