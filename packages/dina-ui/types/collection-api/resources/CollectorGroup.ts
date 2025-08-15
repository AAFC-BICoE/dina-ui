import { KitsuResource, PersistedResource } from "kitsu";
import { Person } from "../../agent-api/resources/Person";
import { baseRelationshipParser } from "../../baseRelationshipParser";

export interface CollectorGroupAttributes {
  uuid: string;
  name: string;
  createdBy?: string;
  createdOn?: string;
  agents?: Person[];
}

export interface CollectorGroupRelationships {
  agentIdentifiers?: KitsuResource[];
}

export type CollectorGroup = KitsuResource &
  CollectorGroupAttributes &
  CollectorGroupRelationships;

export interface CollectorGroupResponseRelationships {
  agentIdentifiers?: {
    data?: PersistedResource<KitsuResource>[];
  };
}

export type CollectorGroupResponse = KitsuResource &
  CollectorGroupResponseRelationships &
  CollectorGroupAttributes;

/**
 * Parses a `PersistedResource<CollectorGroupResponse>` object and transforms it into a `PersistedResource<CollectorGroup>`.
 *
 * This function omits specific relationship properties from the input collector group and restructures the relationships
 * to use their `.data` subfields as their values.
 *
 * @param data - The response.data object to parse, of type `PersistedResource<CollectorGroupResponse>`.
 * @returns The parsed collector group resource, of type `PersistedResource<CollectorGroup>`.
 */
export function collectorGroupParser(
  data: PersistedResource<CollectorGroupResponse>
) {
  const parsedCollectorGroup = baseRelationshipParser(
    ["agentIdentifiers"],
    data
  ) as PersistedResource<CollectorGroup>;

  return parsedCollectorGroup;
}
