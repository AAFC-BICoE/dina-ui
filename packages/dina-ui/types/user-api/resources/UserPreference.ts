import { KitsuResource } from "kitsu";
import { SavedSearchStructure } from "common-ui/lib/list-page/saved-searches/types";
import { JsonValue } from "type-fest";

export interface UserPreferenceAttributes {
  uiPreference?: Map<string, JsonValue>;
  savedSearches?: SavedSearchStructure;
  savedExportColumnSelection?: SavedExportColumnStructure[];
  userId?: string;
  createdOn?: string;
  type: "user-preference";
}

export interface SavedExportColumnStructure {
  name: string;
  component: string;
  columns: string[];
  columnAliases: string[];
}

export type UserPreference = KitsuResource & UserPreferenceAttributes;
