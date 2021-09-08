import { KitsuResource } from "kitsu";
import { Institution } from "..";
import { HasDinaMetaInfo } from "../../DinaJsonMetaInfo";
import { MultilingualDescription } from "./PreparationType";

export interface CollectionAttributes {
  type: "collection" | string;
  group?: string;
  name?: string;
  code?: string;
  createdOn?: string;
  createdBy?: string;
  multilingualDescription?: MultilingualDescription;
}

export interface CollectionRelationships {
  institution: Institution | undefined;
}

export type Collection = KitsuResource &
  CollectionAttributes &
  HasDinaMetaInfo &
  CollectionRelationships;
