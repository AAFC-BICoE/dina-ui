import _ from "lodash";
import { useQuery } from "../../../common-ui/lib";
import { useDinaIntl } from "../../../dina-ui/intl/dina-ui-intl";
import { VocabularyOption } from "./VocabularySelectField";
import { TypedVocabulary } from "packages/dina-ui/types/collection-api/resources/TypedVocabularyElement";

/** Gets the typed vocab options from the back-end. */
export default function useTypedVocabularyOptions<T extends TypedVocabulary>({
  path
}) {
  const { response, loading } = useQuery<T[]>({
    path,
    page: { limit: 1000 }
  });
  const { locale } = useDinaIntl();

  const vocabOptions =
    response?.data?.map?.((vocab) => toOption(vocab as T)) ?? [];

  const directVocabs = response?.data;

  function toOption(value: T): VocabularyOption {
    const label =
      _.find(
        value?.multilingualTitle?.titles || [],
        (item) => item.lang === locale
      )?.title ||
      value.id ||
      "";
    return { label, value: value.id };
  }

  return {
    toOption,
    loading,
    vocabOptions,
    typedVocabularies: directVocabs as T[]
  };
}
