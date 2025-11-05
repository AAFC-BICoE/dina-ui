import { KitsuResource } from "kitsu";
import { HasDinaMetaInfo } from "../../DinaJsonMetaInfo";
export interface OrganizationAttributes {
  type: "organization";
  name?: Map<string, string>;
  names: MultiligualName[];
  aliases?: string[];
  uuid: string;
  createdBy?: string;
  createdOn?: string;
}

export type MultiligualName = {
  languageCode: string;
  name: string;
};

export type Organization = KitsuResource &
  OrganizationAttributes &
  HasDinaMetaInfo;
