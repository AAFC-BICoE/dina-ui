import { KitsuResource } from "kitsu";
import { Determination } from "..";

export interface OrganismAttributes {
  type: "organism";
  group?: string;
  lifeStage?: string | null;
  sex?: string | null;
  remarks?: string | null;
  isTarget?: boolean | null;
  determination?: Determination[] | null;
  createdOn?: string;
  createdBy?: string;
}

export type Organism = KitsuResource & OrganismAttributes;
