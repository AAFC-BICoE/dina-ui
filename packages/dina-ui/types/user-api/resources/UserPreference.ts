import { KitsuResource } from "kitsu";
import { SavedSearchStructure } from "common-ui/lib/list-page/saved-searches/types";
import SavedExportColumnStructure from "packages/dina-ui/pages/export/data-export/types";
import { JsonValue } from "type-fest";

export interface UserPreferenceAttributes {
  uiPreference?: Map<string, JsonValue>;
  savedSearches?: SavedSearchStructure;
  savedExportColumnSelection?: SavedExportColumnStructure[];
  userId?: string;
  createdOn?: string;
  type: "user-preference";
}

export type UserPreference = KitsuResource & UserPreferenceAttributes;
