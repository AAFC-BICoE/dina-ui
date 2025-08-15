import { ResourceIdentifierObject } from "jsonapi-typescript";
import { PersistedResource, KitsuResource } from "kitsu";
import { MultilingualDescription, MultilingualTitle } from "../../common";
import { baseRelationshipParser } from "../../baseRelationshipParser";

export interface AssemblageAttributes {
  type: "assemblage";
  name: string;
  multilingualTitle?: MultilingualTitle;
  multilingualDescription?: MultilingualDescription;
  createdOn?: string;
  createdBy?: string;
  group?: string;
}

export interface AssemblageResponseRelationships {
  attachment?: { data: ResourceIdentifierObject[] };
}

export type AssemblageResponse = KitsuResource &
  AssemblageAttributes &
  AssemblageResponseRelationships;

export interface AssemblageRelationships {
  data?: ResourceIdentifierObject[];
}

export type Assemblage = KitsuResource &
  AssemblageAttributes &
  AssemblageRelationships;

/**
 * Parses a `PersistedResource<Assemblage>` object and transforms it into a `PersistedResource<Assemblage>`.
 *
 * This function omits specific relationship properties from the input assemblage and restructures the relationships
 * to use their `.data` subfields as their values.
 *
 * @param data - The response.data object to parse, of type `PersistedResource<AssemblageResponse>`.
 * @returns The parsed material sample resource, of type `PersistedResource<Assemablage>`.
 */
export function assemblageParser(
  data: PersistedResource<AssemblageResponse>
): PersistedResource<Assemblage> {
  const parsedAssemablage = baseRelationshipParser(
    ["attachment"],
    data
  ) as PersistedResource<Assemblage>;

  return parsedAssemablage;
}
