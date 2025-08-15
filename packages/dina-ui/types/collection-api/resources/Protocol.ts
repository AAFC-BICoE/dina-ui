import { KitsuResource, PersistedResource } from "kitsu";
import { ResourceIdentifierObject } from "jsonapi-typescript";
import { MultilingualDescription } from "../../common";
import { baseRelationshipParser } from "../../baseRelationshipParser";

/* eslint-disable @typescript-eslint/no-duplicate-enum-values */
export enum ProtocolDataUnitEnum {
  MM = "millimolar",
  UG_ML = "microgram_per_millilitre",
  UL = "microlitre",
  UL_ML = "microgram_per_millilitre",
  UL_RXN = "microliter_per_reaction",
  UM = "micromole_per_liter"
}
/* eslint-enable @typescript-eslint/no-duplicate-enum-values */

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

export interface ProtocolResponseRelationships {
  attachments?: {
    data?: PersistedResource<ResourceIdentifierObject>[];
  };
}

export type ProtocolResponse = KitsuResource &
  ProtocolAttributes &
  ProtocolResponseRelationships;

/**
 * Parses a `PersistedResource<ProtocolResponse>` object and transforms it into a `PersistedResource<Protocol>`.
 *
 * This function omits specific relationship properties from the input protocol and restructures the relationships
 * to use their `.data` subfields as their values.
 *
 * @param data - The response.data object to parse, of type `PersistedResource<ProtocolResponse>`.
 * @returns The parsed protocol resource, of type `PersistedResource<Protocol>`.
 */
export function protocolParser(
  data: PersistedResource<ProtocolResponse>
): PersistedResource<Protocol> {
  const parsedProtocol = baseRelationshipParser(
    ["attachments"],
    data
  ) as PersistedResource<Protocol>;

  return parsedProtocol;
}
