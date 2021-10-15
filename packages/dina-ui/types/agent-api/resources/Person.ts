import { KitsuResource } from "kitsu";
import { PersonIdentifier } from "./Identifier";
import { Organization } from "./Organization";

export interface PersonAttributes {
  type: "person";
  displayName: string;
  givenNames?: string;
  familyNames?: string;
  aliases?: string[];
  email: string;
  uuid: string | undefined;
  createdBy?: string;
  createdOn?: string;
  identifiers?: PersonIdentifier[];
  webpage?: URL;
  remarks?: string;
}

export interface PersonRelationships {
  organizations?: Organization[];
}

export type Person = KitsuResource & PersonAttributes & PersonRelationships;
