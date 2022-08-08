import { KitsuResource } from "kitsu";
import { Institution } from "..";
import { MultilingualDescription } from "../../common";
import { HasDinaMetaInfo } from "../../DinaJsonMetaInfo";

export interface CollectionAttributes {
  type: "collection" | string;
  group?: string;
  name?: string;
  code?: string;
  createdOn?: string;
  createdBy?: string;
  multilingualDescription?: MultilingualDescription;
  webpage?: string;
  contact?: string;
  address?: string;
  remarks?: string;
}

export interface CollectionRelationships {
  institution: Institution | undefined;
  parentCollection?: Collection | undefined;
}

export type Collection = KitsuResource &
  CollectionAttributes &
  HasDinaMetaInfo &
  CollectionRelationships;
