import { KitsuResource } from "kitsu";
import { HasDinaMetaInfo } from "../../DinaJsonMetaInfo";
import { MultiligualName } from "../../common/resources/MultilingualName";

export interface OrganizationAttributes {
  type: "organization";
  name?: Map<string, string>;
  names: MultiligualName[];
  aliases?: string[];
  uuid: string;
  createdBy?: string;
  createdOn?: string;
}

export type Organization = KitsuResource &
  OrganizationAttributes &
  HasDinaMetaInfo;
