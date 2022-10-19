import { KitsuResource } from "kitsu";
import { SavedSearchStructure } from "packages/common-ui/lib/list-page/saved-searches/types";
import { JsonValue } from "type-fest";

export interface UserPreferenceAttributes {
  uiPreference?: Map<string, JsonValue>;
  savedSearches?: SavedSearchStructure;
  userId?: string;
  createdOn?: string;
  type: "user-preference";
}

export type UserPreference = KitsuResource & UserPreferenceAttributes;
