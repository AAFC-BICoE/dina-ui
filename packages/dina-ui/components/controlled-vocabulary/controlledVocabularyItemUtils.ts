import { InputResource, PersistedResource } from "kitsu";
import { fromPairs } from "lodash";
import {
  COLLECTION_MODULE_TYPE_LABELS,
  COLLECTION_MODULE_TYPES
} from "../../types/collection-api/resources/CollectionModuleType";
import { VocabularyElementType } from "../../types/collection-api/resources/VocabularyElementType";
import {
  OBJECT_STORE_MODULE_TYPE_LABELS,
  OBJECT_STORE_MODULE_TYPES
} from "../../types/objectstore-api/resources/ObjectStoreModuleTypes";
import { ControlledVocabularyItem } from "../../types/collection-api/resources/ControlledVocabularyItem";

export const COLLECTION_OTHER_IDENTIFIERS_ID =
  "019c961e-4c0d-7398-b4ae-73687826b3b5";

export const COLLECTION_MANAGED_ATTRIBUTE_ID =
  "01998155-a6f0-7c2f-9fcc-994d74222f9c";

export const OBJECT_STORE_MANAGED_ATTRIBUTE_ID =
  "b8527bdf-a1d2-465d-a8bb-2a66d552de23";

export type ControlledVocabularyApi = "collection" | "objectstore";

export interface ControlledVocabularyApiConfig {
  apiPath: string;
  apiBaseUrl: string;
  entityLink: string;
  editRoute: string;
  viewRoute: string;
  listRoute: string;
  /** Data component types available when creating/editing an item in this API. */
  componentTypes: readonly string[];
  /** i18n key for each component type, used as the option label. */
  componentTypeLabels: Record<string, string>;
}

/**
 * API, route and form configuration for the controlled-vocabulary-item pages.
 * A controlled vocabulary item may reside in any of the configured APIs, and
 * each API has its own page routes and data component types.
 */
export const CONTROLLED_VOCABULARY_APIS: Record<
  ControlledVocabularyApi,
  ControlledVocabularyApiConfig
> = {
  collection: {
    apiPath: "collection-api",
    apiBaseUrl: "/collection-api",
    entityLink: "/controlled-vocabulary-item",
    editRoute: "/controlled-vocabulary-item/edit",
    viewRoute: "/controlled-vocabulary-item/view",
    listRoute: "/controlled-vocabulary/list",
    componentTypes: COLLECTION_MODULE_TYPES,
    componentTypeLabels: COLLECTION_MODULE_TYPE_LABELS as Record<string, string>
  },
  objectstore: {
    apiPath: "objectstore-api",
    apiBaseUrl: "/objectstore-api",
    entityLink: "/object-store/controlled-vocabulary-item",
    editRoute: "/object-store/controlled-vocabulary-item/edit",
    viewRoute: "/object-store/controlled-vocabulary-item/view",
    listRoute: "/controlled-vocabulary/list?tab=1",
    componentTypes: OBJECT_STORE_MODULE_TYPES,
    componentTypeLabels: OBJECT_STORE_MODULE_TYPE_LABELS as Record<
      string,
      string
    >
  }
};

/**
 * Transforms a ControlledVocabularyItem from the API format to a format suitable for form editing.
 * - Converts multilingualDescription from array format to dictionary format
 * - Converts multilingualTitle from array format to dictionary format
 * - Sets vocabularyElementType to PICKLIST if acceptedValues has items
 */
export function transformControlledVocabularyItemForForm(
  item: PersistedResource<ControlledVocabularyItem>
): InputResource<ControlledVocabularyItem> {
  return {
    ...item,
    // Convert multilingualDescription to editable Dictionary format:
    multilingualDescription: fromPairs<string | undefined>(
      item.multilingualDescription?.descriptions?.map(({ desc, lang }) => [
        lang ?? "",
        desc ?? ""
      ])
    ),
    // Convert multilingualTitle to editable Dictionary format:
    multilingualTitle: fromPairs<string | undefined>(
      item.multilingualTitle?.titles?.map(({ title, lang }) => [
        lang ?? "",
        title ?? ""
      ])
    ),
    // Set vocabularyElementType to PICKLIST if acceptedValues has items
    vocabularyElementType: item.acceptedValues?.length
      ? "PICKLIST"
      : item.vocabularyElementType
  } as InputResource<ControlledVocabularyItem>;
}

/**
 * Gets the initial vocabulary element type for the form based on the item's data.
 */
export function getInitialVocabularyElementType(
  item: InputResource<ControlledVocabularyItem> | undefined
): VocabularyElementType | undefined {
  if (!item) return undefined;
  return item.acceptedValues?.length
    ? "PICKLIST"
    : (item.vocabularyElementType as VocabularyElementType | undefined);
}
