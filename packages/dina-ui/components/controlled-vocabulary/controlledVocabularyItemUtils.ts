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
  listRoute: string;
  /** Data component types available when creating/editing an item in this API. */
  componentTypes: readonly string[];
  /** i18n key for each component type, used as the option label. */
  componentTypeLabels: Record<string, string>;
}

/**
 * API, route and form configuration for the controlled vocabulary pages.
 * A controlled vocabulary item may reside in any of the configured APIs, and
 * each API has its own data component types.
 */
export const CONTROLLED_VOCABULARY_APIS: Record<
  ControlledVocabularyApi,
  ControlledVocabularyApiConfig
> = {
  collection: {
    apiPath: "collection-api",
    apiBaseUrl: "/collection-api",
    listRoute: "/controlled-vocabulary/list",
    componentTypes: COLLECTION_MODULE_TYPES,
    componentTypeLabels: COLLECTION_MODULE_TYPE_LABELS as Record<string, string>
  },
  objectstore: {
    apiPath: "objectstore-api",
    apiBaseUrl: "/objectstore-api",
    listRoute: "/controlled-vocabulary/list?tab=1",
    componentTypes: OBJECT_STORE_MODULE_TYPES,
    componentTypeLabels: OBJECT_STORE_MODULE_TYPE_LABELS as Record<
      string,
      string
    >
  },
  sequencing: {
    apiPath: "seqdb-api",
    apiBaseUrl: "/seqdb-api",
    listRoute: "/controlled-vocabulary/list?tab=2",
    componentTypes: SEQDB_MODULE_TYPES,
    componentTypeLabels: SEQDB_MODULE_TYPE_LABELS as Record<string, string>
  },
  agent: {
    apiPath: "agent-api",
    apiBaseUrl: "/agent-api",
    listRoute: "/controlled-vocabulary/list?tab=3",
    componentTypes: AGENT_MODULE_TYPES,
    componentTypeLabels: AGENT_MODULE_TYPE_LABELS as Record<string, string>
  }
};

/** Reads the API from a page's ?api= param, falling back to collection when it's missing or unknown. */
export function getControlledVocabularyApi(
  query: Record<string, string | string[] | undefined>
): ControlledVocabularyApi {
  const api = String(query.api);
  // Not "in", which would also accept inherited keys like "toString".
  return Object.keys(CONTROLLED_VOCABULARY_APIS).includes(api)
    ? (api as ControlledVocabularyApi)
    : "collection";
}

/**
 * Link to a controlled vocabulary page, which reads the API from its ?api= param.
 * e.g. controlledVocabularyPageUrl("/controlled-vocabulary-item/view", "agent", { id })
 */
export function controlledVocabularyPageUrl(
  path: string,
  api: ControlledVocabularyApi,
  params: Record<string, string> = {}
) {
  return `${path}?${new URLSearchParams({ api, ...params })}`;
}

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

/**
 * Position for a new item: after the last item of an ordered vocabulary, or undefined when the
 * vocabulary isn't ordered (the API rejects positions there). Uses the highest position rather
 * than the item count, since deleting items leaves gaps.
 */
export async function getNewItemPosition(
  apiClient: { get: (path: string, params: any) => Promise<any> },
  apiPath: string,
  vocabularyId: string
): Promise<number | undefined> {
  const { data: vocabulary } = await apiClient.get(
    `${apiPath}/controlled-vocabulary/${vocabularyId}`,
    {}
  );
  if (!vocabulary?.ordered) {
    return undefined;
  }
  const { data: lastItems } = await apiClient.get(
    `${apiPath}/controlled-vocabulary-item`,
    {
      filter: { "controlledVocabulary.uuid": { EQ: vocabularyId } },
      sort: "-position",
      page: { limit: 1 }
    }
  );
  return (lastItems?.[0]?.position ?? 0) + 1;
}
