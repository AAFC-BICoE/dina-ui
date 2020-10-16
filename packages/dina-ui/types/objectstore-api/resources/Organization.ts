import { KitsuResource } from "kitsu";

export interface OrganizationAttributes {
  type: "organization";
  name?: string;
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

export type Organization = KitsuResource & OrganizationAttributes;
