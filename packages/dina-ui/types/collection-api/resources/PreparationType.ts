import { KitsuResource } from "kitsu";
import { MultilingualDescription } from "../../common";
import { HasDinaMetaInfo } from "../../DinaJsonMetaInfo";

export interface PreparationTypeAttributes {
  type: "preparation-type";
  name: string;
  createdBy?: string;
  createdOn?: string;
  group?: string;
  multilingualDescription?: MultilingualDescription;
}

export type PreparationType = KitsuResource &
  PreparationTypeAttributes &
  HasDinaMetaInfo;
