import { ResourceIdentifierObject } from "jsonapi-typescript";
import { KitsuResource, PersistedResource } from "kitsu";
import { MultilingualDescription } from "../../common";
import { AgentRole } from "../../loan-transaction-api";
import { baseRelationshipParser } from "../../baseRelationshipParser";

export interface ProjectAttributes {
  type: "project";
  name: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  multilingualDescription?: MultilingualDescription;
  createdOn?: string;
  createdBy?: string;
  group?: string;
  extensionValues?: Record<string, string>;
  contributors?: AgentRole[];
}

export interface ProjectRelationships {
  attachment?: ResourceIdentifierObject[];
}

export type Project = KitsuResource & ProjectAttributes & ProjectRelationships;

export interface ProjectResponseRelationships {
  attachment?: {
    data?: ResourceIdentifierObject[];
  };
}

export type ProjectResponse = KitsuResource &
  ProjectAttributes &
  ProjectResponseRelationships;

/**
 * Parses a `PersistedResource<ProjectResponse>` object and transforms it into a `PersistedResource<Project>`.
 *
 * This function omits specific relationship properties from the input project and restructures the relationships
 * to use their `.data` subfields as their values.
 *
 * @param data - The response.data object to parse, of type `PersistedResource<ProjectResponse>`.
 *
 * @returns The parsed project resource, of type `PersistedResource<Project>`.
 */
export function projectParser(
  data: PersistedResource<ProjectResponse>
): PersistedResource<Project> {
  const parsedProject = baseRelationshipParser(
    ["attachment"],
    data
  ) as PersistedResource<Project>;
  return parsedProject;
}
