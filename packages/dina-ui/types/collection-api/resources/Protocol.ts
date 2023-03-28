import { KitsuResource } from "kitsu";
import { ResourceIdentifierObject } from "jsonapi-typescript";
import { MultilingualDescription } from "../../common";

export interface ProtocolData {
  key?: string;
  vocabularyBased?: boolean;
  protocolDataElement?:
    | {
        elementType?: string;
        value?: string;
        vocabularyBased?: boolean;
        unit?: string | null;
      }[]
    | null;
}

export interface ProtocolAttributes {
  type: "protocol";
  name: string;
  protocolType?: string;
  createdBy?: string;
  createdOn?: string;
  group?: string;
  multilingualDescription?: MultilingualDescription;
  protocolData?: ProtocolData[];
}

export interface ProtocolRelationships {
  attachments?: ResourceIdentifierObject[];
}

export type Protocol = KitsuResource &
  ProtocolAttributes &
  ProtocolRelationships;
