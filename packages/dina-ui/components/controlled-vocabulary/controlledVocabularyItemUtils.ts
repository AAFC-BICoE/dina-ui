import { InputResource, PersistedResource } from "kitsu";
import { fromPairs, toPairs } from "lodash";
import {
  COLLECTION_MODULE_TYPE_LABELS,
  COLLECTION_MODULE_TYPES
} from "../../types/collection-api/resources/CollectionModuleType";
import { VocabularyElementType } from "../../types/collection-api/resources/VocabularyElementType";
import {
  OBJECT_STORE_MODULE_TYPE_LABELS,
  OBJECT_STORE_MODULE_TYPES
} from "../../types/objectstore-api/resources/ObjectStoreModuleTypes";
import {
  SEQDB_MODULE_TYPE_LABELS,
  SEQDB_MODULE_TYPES
} from "../../types/seqdb-api/resources/SeqDBModuleType";
import {
  AGENT_MODULE_TYPE_LABELS,
  AGENT_MODULE_TYPES
} from "../../types/agent-api/resources/AgentModuleType";
import { ControlledVocabularyItem } from "../../types/collection-api/resources/ControlledVocabularyItem";
import { MultilingualDescription, MultilingualTitle } from "../../types/common";

export const COLLECTION_OTHER_IDENTIFIERS_ID =
  "019c961e-4c0d-7398-b4ae-73687826b3b5";

export const COLLECTION_MANAGED_ATTRIBUTE_ID =
  "01998155-a6f0-7c2f-9fcc-994d74222f9c";

export const OBJECT_STORE_MANAGED_ATTRIBUTE_ID =
  "b8527bdf-a1d2-465d-a8bb-2a66d552de23";

export const SEQDB_MANAGED_ATTRIBUTE_ID =
  "fe62b8b4-875d-43b4-91a8-94f85b3aae42";

export const SEQDB_MOLECULAR_ANALYSIS_TYPE_ID =
  "f964c7f8-526e-4b4a-88d4-264f77e6c324";

export const AGENT_IDENTIFIERS_ID = "bff566b9-4044-4e0c-a9cd-0ab22c6f0e5b";

export type ControlledVocabularyApi =
  | "collection"
  | "objectstore"
  | "sequencing"
  | "agent";

export interface ControlledVocabularyApiConfig {
  apiPath: string;
  apiBaseUrl: string;
  entityLink: string;
  editRoute: string;
  viewRoute: string;
  listRoute: string;
  /** Base route of the pages of a controlled vocabulary (the type its items belong to), e.g. its "/view" page. */
  vocabularyEntityLink: string;
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
    vocabularyEntityLink: "/controlled-vocabulary",
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
    vocabularyEntityLink: "/object-store/controlled-vocabulary",
    componentTypes: OBJECT_STORE_MODULE_TYPES,
    componentTypeLabels: OBJECT_STORE_MODULE_TYPE_LABELS as Record<
      string,
      string
    >
  },
  sequencing: {
    apiPath: "seqdb-api",
    apiBaseUrl: "/seqdb-api",
    entityLink: "/seqdb/controlled-vocabulary-item",
    editRoute: "/seqdb/controlled-vocabulary-item/edit",
    viewRoute: "/seqdb/controlled-vocabulary-item/view",
    listRoute: "/controlled-vocabulary/list?tab=2",
    vocabularyEntityLink: "/seqdb/controlled-vocabulary",
    componentTypes: SEQDB_MODULE_TYPES,
    componentTypeLabels: SEQDB_MODULE_TYPE_LABELS as Record<string, string>
  },
  agent: {
    apiPath: "agent-api",
    apiBaseUrl: "/agent-api",
    entityLink: "/agent/controlled-vocabulary-item",
    editRoute: "/agent/controlled-vocabulary-item/edit",
    viewRoute: "/agent/controlled-vocabulary-item/view",
    listRoute: "/controlled-vocabulary/list?tab=3",
    vocabularyEntityLink: "/agent/controlled-vocabulary",
    componentTypes: AGENT_MODULE_TYPES,
    componentTypeLabels: AGENT_MODULE_TYPE_LABELS as Record<string, string>
  }
};

/**
 * Converts multilingualTitle and multilingualDescription from the stored format to the
 * editable { lang: text } format used by the MultilingualTitle and MultilingualDescription fields.
 */
export function multilingualFieldsForForm(resource: {
  multilingualTitle?: MultilingualTitle;
  multilingualDescription?: MultilingualDescription;
}) {
  return {
    multilingualDescription: fromPairs<string | undefined>(
      resource.multilingualDescription?.descriptions?.map(({ desc, lang }) => [
        lang ?? "",
        desc ?? ""
      ])
    ),
    multilingualTitle: fromPairs<string | undefined>(
      resource.multilingualTitle?.titles?.map(({ title, lang }) => [
        lang ?? "",
        title ?? ""
      ])
    )
  };
}

/**
 * Converts the editable multilingualTitle and multilingualDescription back to the stored format.
 * Only the non-empty values are kept, and a field is set to null when all of them are empty.
 */
export function multilingualFieldsForSave<T extends Record<string, any>>(
  submittedValues: T
): T {
  const values: Record<string, any> = submittedValues;
  if (values.multilingualDescription) {
    try {
      const descriptions = toPairs(values.multilingualDescription)
        .map(([lang, desc]) => ({ lang, desc }))
        .filter(
          ({ desc }) =>
            desc !== null && desc !== undefined && String(desc).trim() !== ""
        );

      values.multilingualDescription =
        descriptions.length > 0 ? { descriptions } : null;
    } catch (_) {
      // If the value is in an unexpected format, don't save anything.
      values.multilingualDescription = null;
    }
  }
  if (values.multilingualTitle) {
    try {
      const titles = toPairs(values.multilingualTitle)
        .map(([lang, title]) => ({ lang, title }))
        .filter(
          ({ title }) =>
            title !== null && title !== undefined && String(title).trim() !== ""
        );

      values.multilingualTitle = titles.length > 0 ? { titles } : null;
    } catch (_) {
      // If the value is in an unexpected format, don't save anything.
      values.multilingualTitle = null;
    }
  }
  return submittedValues;
}

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
    ...multilingualFieldsForForm(item),
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
