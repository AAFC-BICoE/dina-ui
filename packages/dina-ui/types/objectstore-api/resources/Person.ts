import { KitsuResource } from "kitsu";
import { Organization } from "./Organization";

export interface PersonAttributes {
  type: "person";
  displayName: string;
  email: string;
  uuid: string;
  createdBy?: string;
  createdOn?: string;
}

export interface PersonRelationships {
  organization?: Organization;
}

export type Person = KitsuResource & PersonAttributes & PersonRelationships;
