import { KitsuResource, PersistedResource } from "kitsu";
import { Identifier } from "./Identifier";
import { Organization } from "./Organization";
import { baseRelationshipParser } from "../../baseRelationshipParser";
export interface PersonAttributes {
  type: "person";
  displayName?: string;
  givenNames?: string;
  familyNames?: string;
  aliases?: string[];
  email?: string;
  uuid?: string | undefined;
  createdBy?: string;
  createdOn?: string;
  webpage?: URL;
  remarks?: string;
}

export interface PersonRelationships {
  organizations?: Organization[];
  identifiers?: Identifier[];
}

export interface PersonResponseRelationships {
  organizations?: { data: Organization[] };
  identifiers?: { data: Identifier[] };
}
export type Person = KitsuResource & PersonAttributes & PersonRelationships;

export type PersonResponse = KitsuResource &
  PersonAttributes &
  PersonResponseRelationships;

/**
 * Parses a `PersistedResource<PersonResponse>` object and transforms it into a `PersistedResource<Person>`.
 *
 * This function omits specific properties from the input metadata and restructures the relationships
 * (`organizations`, `identifiers`) to use their `.data` subfields as their values.
 *
 *
 * @param data - The response.data object to parse, of type `PersistedResource<PersonResponse>`.
 * @returns The parsed metadata resource, of type `PersistedResource<Person>`.
 */
export function personParser(
  data: PersistedResource<PersonResponse>
): PersistedResource<Person> {
  const parsedPerson = baseRelationshipParser(
    ["organizations", "identifiers"],
    data
  ) as PersistedResource<Person>;

  return parsedPerson;
}
