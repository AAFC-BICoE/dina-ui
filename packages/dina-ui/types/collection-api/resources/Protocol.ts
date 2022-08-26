import { KitsuResource } from "kitsu";
import { ResourceIdentifierObject } from "jsonapi-typescript";
import { MultilingualDescription } from "../../common";

export interface ProtocolAttributes {
  type: "protocol";
  name: string;
  createdBy?: string;
  createdOn?: string;
  group?: string;
  multilingualDescription?: MultilingualDescription;
}

export interface ProtocolRelationships {
  attachments?: ResourceIdentifierObject[];
}

export type Protocol = KitsuResource &
  ProtocolAttributes &
  ProtocolRelationships;
