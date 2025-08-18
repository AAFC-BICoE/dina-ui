import { KitsuResource, PersistedResource } from "kitsu";
import { baseRelationshipParser } from "../../baseRelationshipParser";
import { Region } from "./Region";

export interface ThermocyclerProfileAttributes {
  type: "thermocycler-profile";
  name: string;
  // Optional fields
  group?: string;
  cycles?: string | null;
  lastModified?: string | null;
  application?: string | null;
  steps?: string[];
}

export interface ThermocyclerProfileRelationships {
  region?: Region | null;
}

export type ThermocyclerProfile = KitsuResource &
  ThermocyclerProfileAttributes &
  ThermocyclerProfileRelationships;

// Response types (what comes from API)
export interface ThermocyclerProfileResponseAttributes {
  type: "thermocycler-profile";
  name: string;
  // Optional fields
  group?: string;
  cycles?: string | null;
  lastModified?: string | null;
  application?: string | null;
  steps?: string[];
}

export interface ThermocyclerProfileResponseRelationships {
  region?: {
    data?: PersistedResource<Region>;
  };
}

export type ThermocyclerProfileResponse = KitsuResource &
  ThermocyclerProfileResponseAttributes &
  ThermocyclerProfileResponseRelationships;

/**
 * Parses a `PersistedResource<ThermocyclerProfileResponse>` object and transforms it into a `PersistedResource<ThermocyclerProfile>`.
 *
 * This function omits specific relationship properties from the input thermocycler profile and restructures the relationships
 * to use their `.data` subfields as their values.
 *
 * @param data - The response.data object to parse, of type `PersistedResource<ThermocyclerProfileResponse>`.
 * @returns The parsed thermocycler profile resource, of type `PersistedResource<ThermocyclerProfile>`.
 */
export function thermocyclerProfileParser(
  data: PersistedResource<ThermocyclerProfileResponse>
): PersistedResource<ThermocyclerProfile> {
  const parsedThermocyclerProfile = baseRelationshipParser(
    ["region"],
    data
  ) as PersistedResource<ThermocyclerProfile>;

  return parsedThermocyclerProfile;
}
