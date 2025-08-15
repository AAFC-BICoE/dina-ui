import { KitsuResource, PersistedResource } from "kitsu";
import { Institution } from "..";
import { MultilingualDescription } from "../../common";
import { HasDinaMetaInfo } from "../../DinaJsonMetaInfo";
import { baseRelationshipParser } from "../../baseRelationshipParser";

export interface CollectionAttributes {
  type: "collection" | string;
  group?: string;
  name?: string;
  code?: string;
  createdOn?: string;
  createdBy?: string;
  multilingualDescription?: MultilingualDescription;
  webpage?: string;
  contact?: string;
  address?: string;
  remarks?: string;
  identifiers?: { [identifierType: string]: string };
}

export interface CollectionRelationships {
  institution?: Institution;
  parentCollection?: Collection;
}

export type Collection = KitsuResource &
  CollectionAttributes &
  HasDinaMetaInfo &
  CollectionRelationships;

export interface CollectionResponseAttributes {
  group?: string;
  name?: string;
  code?: string;
  createdOn?: string;
  createdBy?: string;
  multilingualDescription?: MultilingualDescription;
  webpage?: string;
  contact?: string;
  address?: string;
  remarks?: string;
  identifiers?: { [identifierType: string]: string };
}
export interface CollectionResponseRelationships {
  institution?: {
    data?: Institution;
  };
  parentCollection?: {
    data?: Collection;
  };
}

export type CollectionResponse = KitsuResource &
  CollectionResponseAttributes &
  CollectionResponseRelationships;

/**
 * Parses a `PersistedResource<CollectionResponse>` object and transforms it into a `PersistedResource<Collection>`.
 *
 * This function omits specific relationship properties from the input collection and restructures the relationships
 * to use their `.data` subfields as their values.
 *
 * @param data - The response.data object to parse, of type `PersistedResource<CollectionResponse>`.
 * @returns The parsed collection resource, of type `PersistedResource<Collection>`.
 */
export function collectionParser(
  data: PersistedResource<CollectionResponse>
): PersistedResource<Collection> {
  const parsedCollection = baseRelationshipParser(
    ["institution", "parentCollection"],
    data
  ) as PersistedResource<Collection>;

  return parsedCollection;
}
