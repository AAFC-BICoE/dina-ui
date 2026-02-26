import _ from "lodash";
import { useQuery } from "common-ui";
import { useDinaIntl } from "../../intl/dina-ui-intl";
import { ControlledVocabularyItem } from "packages/dina-ui/types/collection-api/resources/ControlledVocabularyItem";

export interface ControlledVocabularyOption {
  label: string;
  value: string;
}

/**
 * Retrieve controlled vocabulary items from the API and transform them into options for select fields.
 *
 * @param path The API path to fetch the controlled vocabulary items from. Filters can be applied to this path to narrow down the results as needed.
 * @returns The options for the controlled vocabulary items.
 */
export default function useControlledVocabularyOptions({ path }) {
  const { response, loading } = useQuery<ControlledVocabularyItem[]>({
    path,
    page: { limit: 1000 }
  });
  const { locale } = useDinaIntl();

  const vocabOptions =
    response?.data?.map?.((vocab) =>
      toOption(vocab as ControlledVocabularyItem)
    ) ?? [];

  const directVocabs = response?.data;

  function toOption(
    value: ControlledVocabularyItem
  ): ControlledVocabularyOption {
    const label =
      _.find(
        value?.multilingualTitle?.titles || [],
        (item) => item.lang === locale
      )?.title ||
      value.name ||
      value.key ||
      value.id ||
      "";
    return { label, value: value.key };
  }

  return {
    toOption,
    loading,
    vocabOptions,
    controlledVocabularies: directVocabs as ControlledVocabularyItem[]
  };
}

export interface ControlledVocabularyFieldHeaderProps {
  controlledVocabularyItem: ControlledVocabularyItem;
  referencedBy?: string;
}

export function ControlledVocabularyFieldHeader({
  controlledVocabularyItem,
  referencedBy
}: ControlledVocabularyFieldHeaderProps) {
  const { locale } = useDinaIntl();
  const label =
    controlledVocabularyItem?.multilingualTitle?.titles?.find(
      (title) => title.lang === locale
    )?.title ??
    (controlledVocabularyItem.name ||
      controlledVocabularyItem.key ||
      controlledVocabularyItem.id);
  return (
    <>
      {referencedBy ? _.startCase(referencedBy) + " - " : ""}
      {_.startCase(label)}
    </>
  );
}
