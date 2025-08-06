import { KitsuResource } from "kitsu";
import { Institution } from "..";
import { MultilingualDescription } from "../../common";
import { HasDinaMetaInfo } from "../../DinaJsonMetaInfo";

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

export interface CollectionResponse {
  type: "collection";
  id: string; // ID is required for all resources
  attributes: CollectionResponseAttributes;
  relationships?: CollectionResponseRelationships;
}

/**
 * Parses the relationships object from a collection API response and extracts
 * the relationship data.
 *
 * @param relationships - The relationships object from the collection API response.
 * @returns An object containing the relationship data.
 */
export function CollectionRelationshipParser(
  relationships: CollectionResponseRelationships
): CollectionRelationships {
  return {
    institution: relationships?.institution?.data,
    parentCollection: relationships?.parentCollection?.data
  };
}

// /**
//  * Parses a CollectionResponse object and transforms it into a Collection object.
//  *
//  * @param collection - The CollectionResponse object to parse.
//  * @returns The parsed Collection object, including its attributes and relationships.
//  */
// export function CollectionParser(collection: CollectionResponse): Collection {
//   const relationships = collection.relationships
//     ? CollectionRelationshipParser(collection.relationships)
//     : {};
//   const parsedCollection: Collection = {
//     id: collection.id,
//     type: collection.type,
//     ...(collection.attributes || {}),
//     ...relationships
//   };

//   return parsedCollection;
// }

export function collectionParser(collection) {
  collection.institution = collection.institution?.data;
  collection.parentCollection = collection.parentCollection?.data;

  return collection;
}
