import { InputResource, PersistedResource } from "kitsu";
import { fromPairs } from "lodash";
import { VocabularyElementType } from "../../types/collection-api";
import { ControlledVocabularyItem } from "../../types/collection-api/resources/ControlledVocabularyItem";

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
