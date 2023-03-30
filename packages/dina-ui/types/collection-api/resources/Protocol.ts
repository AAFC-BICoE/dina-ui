import { KitsuResource } from "kitsu";
import { ResourceIdentifierObject } from "jsonapi-typescript";
import { MultilingualDescription } from "../../common";

export enum ProtocolDataUnitEnum {
  MM = "millimolar",
  UG_ML = "microgram_per_millilitre",
  UL = "microlitre",
  UL_ML = "microgram_per_millilitre",
  UL_RXN = "microliter_per_reaction",
  UM = "micromole_per_liter"
}

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
