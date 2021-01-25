import { KitsuResource } from "kitsu";

export interface DefaultValueAttributes {
  type: string;
  attribute: string;
  value: string;
}

export type DefaultValue = KitsuResource & DefaultValueAttributes;
