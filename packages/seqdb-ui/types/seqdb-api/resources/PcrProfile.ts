import { KitsuResource } from "kitsu";
import { Group } from "./Group";
import { Region } from "./Region";

export interface PcrProfileAttributes {
  name: string;
  // Optional fields
  cycles?: string;
  lastModified?: string;
  application?: string;
  step1?: string;
  step2?: string;
  step3?: string;
  step4?: string;
  step5?: string;
  step6?: string;
  step7?: string;
  step8?: string;
  step9?: string;
  step10?: string;
  step11?: string;
  step12?: string;
  step13?: string;
  step14?: string;
  step15?: string;
}

export interface PcrProfileRelationships {
  region?: Region;
  group?: Group;
}

export type PcrProfile = KitsuResource &
  PcrProfileAttributes &
  PcrProfileRelationships;
