import { KitsuResource } from "kitsu";
import { MultilingualTitle } from "../../common";

export interface ProtocolElementAttributes {
  type: "protocol-element";
  term?: string;
  vocabularyElementType?: string;
  multilingualTitle?: MultilingualTitle;
}

export type ProtocolElement = KitsuResource & ProtocolElementAttributes;
