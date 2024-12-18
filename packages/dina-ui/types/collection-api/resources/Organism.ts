import { KitsuResource } from "kitsu";
import { Determination, ManagedAttributeValues } from "..";

export interface OrganismAttributes {
  type: "organism";
  group?: string;
  lifeStage?: string | null;
  sex?: string | null;
  remarks?: string | null;
  dwcVernacularName?: string | null;
  isTarget?: boolean | null;
  determination?: Determination[] | null;
  managedAttributes?: ManagedAttributeValues;
  createdOn?: string;
  createdBy?: string;
}

export type Organism = KitsuResource & OrganismAttributes;
