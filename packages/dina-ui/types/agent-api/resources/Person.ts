import { KitsuResource } from "kitsu";
import { Organization } from "./Organization";

export interface PersonAttributes {
  type: "person";
  displayName: string;
  givenNames?: string;
  familyNames?: string;
  aliases?: string[];
  email: string;
  uuid: string;
  createdBy?: string;
  createdOn?: string;
}

export interface PersonRelationships {
  organizations?: Organization[];
}

export type Person = KitsuResource & PersonAttributes & PersonRelationships;
