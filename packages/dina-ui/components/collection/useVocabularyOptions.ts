import { find } from "lodash";
import { useQuery } from "../../../common-ui/lib";
import { useDinaIntl } from "../../../dina-ui/intl/dina-ui-intl";
import {
  Vocabulary,
  VocabularyElement
} from "packages/dina-ui/types/collection-api";
import { VocabularyOption } from "./VocabularySelectField";

/** Gets the vocab options from the back-end. */
export default function useVocabularyOptions({ path }) {
  const { response, loading } = useQuery<Vocabulary>({ path });
  const { locale } = useDinaIntl();

  const vocabOptions = response?.data?.vocabularyElements?.map(toOption) ?? [];

  function toOption(value: string | VocabularyElement): VocabularyOption {
    if (typeof value === "string") {
      return {
        label: vocabOptions.find((it) => it.value === value)?.label || value,
        value
      };
    }
    const label =
      find(
        value?.multilingualTitle?.titles || [],
        (item) => item.lang === locale
      )?.title ||
      value.name ||
      "";
    return { label, value: value.key };
  }

  return { toOption, loading, vocabOptions };
}
