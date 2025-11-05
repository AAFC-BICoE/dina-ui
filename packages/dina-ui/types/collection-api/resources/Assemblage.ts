import { ResourceIdentifierObject } from "jsonapi-typescript";
import { KitsuResource } from "kitsu";
import { MultilingualDescription, MultilingualTitle } from "../../common";
import { HasDinaMetaInfo } from "../../DinaJsonMetaInfo";
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
  AssemblageRelationships &
  HasDinaMetaInfo;
