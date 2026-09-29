import { KitsuResource } from "kitsu";
import { Identifier } from "./Identifier";
import { Organization } from "./Organization";
import { HasDinaMetaInfo } from "../../DinaJsonMetaInfo";
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

  /**
   * Transient property used to allow duplicate names for a person.
   * This is not persisted in the database and is only used for validation purposes.
   */
  allowDuplicateName?: boolean;
}

export interface PersonRelationships {
  organizations?: Organization[];
  identifiers?: Identifier[];
}

export type Person = KitsuResource &
  PersonAttributes &
  PersonRelationships &
  HasDinaMetaInfo;
