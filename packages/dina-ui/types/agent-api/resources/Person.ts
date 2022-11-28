import { KitsuResource } from "kitsu";
import { Identifier } from "./Identifier";
import { Organization } from "./Organization";

export interface PersonAttributes {
  type: "person";
  displayName?: string;
  givenNames?: string;
  familyNames?: string;
  aliases?: string[];
  email?: string;
  uuid?: string | undefined;
  createdBy?: string;
  createdOn?: string;
  webpage?: URL;
  remarks?: string;
}

export interface PersonRelationships {
  organizations?: Organization[];
  identifiers?: Identifier[];
}

export type Person = KitsuResource & PersonAttributes & PersonRelationships;
