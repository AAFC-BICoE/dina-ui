import { KitsuResource } from "kitsu";
import { JsonValue } from "type-fest";

export interface UserPreferenceAttributes {
  uiPreference?: Map<string, JsonValue>;
  savedSearches?: Map<string, JsonValue>;
  userId?: string;
  createdOn?: string;
  type: "user-preference";
}

export type UserPreference = KitsuResource & UserPreferenceAttributes;
