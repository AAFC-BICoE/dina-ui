import { KitsuResource } from "kitsu";

export interface OrganizationAttributes {
  type: "organization";
  name: string;
  aliases?: string[];
  uuid: string;
  createdBy?: string;
  createdOn?: string;
}

export type Organization = KitsuResource & OrganizationAttributes;
