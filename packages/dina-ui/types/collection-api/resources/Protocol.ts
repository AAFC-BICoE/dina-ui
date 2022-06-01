import { KitsuResource } from "kitsu";

export interface MultilingualDescription {
  descriptions?: MultilingualPair[] | null;
}

export interface MultilingualPair {
  lang?: string | null;
  desc?: string | null;
}

export interface ProtocolAttributes {
  type: "protocol";
  name: string;
  createdBy?: string;
  createdOn?: string;
  group?: string;
  multilingualDescription?: MultilingualDescription;
}

export type Protocol = KitsuResource & ProtocolAttributes;
