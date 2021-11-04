import { KitsuResource } from "kitsu";

export interface OrganismAttribute {
  lifeStage?: string | null;
  sex?: string | null;
  substrate?: string | null;
  remarks?: string | null;
}

export type Organism = KitsuResource & OrganismAttribute;
