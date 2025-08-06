import { ResourceIdentifierObject } from "jsonapi-typescript";
import { KitsuResource } from "kitsu";
import { MultilingualDescription, MultilingualTitle } from "../../common";

export interface AssemblageAttributes {
  type: "assemblage";
  name: string;
  multilingualTitle?: MultilingualTitle;
  multilingualDescription?: MultilingualDescription;
  createdOn?: string;
  createdBy?: string;
  group?: string;
}

export interface AssemblageRelationships {
  attachment?: ResourceIdentifierObject[];
}

export type Assemblage = KitsuResource &
  AssemblageAttributes &
  AssemblageRelationships;

export function assemblageParser(assemblage) {
  assemblage.attachment = assemblage.attachment?.data;

  return assemblage;
}
