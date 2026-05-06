import { KitsuResource } from "kitsu";
import { MaterialSample } from "./MaterialSample";

export interface AssociationAttributes {
  type: "association";
  associationType?: string;
  remarks?: string;
  createdOn?: string;
  createdBy?: string;
}

export interface AssociationRelationships {
  sample?: MaterialSample;
  associatedSample?: MaterialSample;
}

export type Association = KitsuResource &
  AssociationAttributes &
  AssociationRelationships;
