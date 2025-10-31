import { KitsuResource } from "kitsu";
import { MultilingualDescription } from "../../common";
import { HasDinaMetaInfo } from "../../DinaJsonMetaInfo";

export interface PreparationMethodAttributes {
  type: "preparation-method";
  name: string;
  createdBy?: string;
  createdOn?: string;
  group?: string;
  multilingualDescription?: MultilingualDescription;
}

export type PreparationMethod = KitsuResource &
  PreparationMethodAttributes &
  HasDinaMetaInfo;
