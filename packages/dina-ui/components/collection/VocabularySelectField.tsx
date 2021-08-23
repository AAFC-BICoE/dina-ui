import { LabelWrapperParams, SelectField, useQuery } from "common-ui";
import { useDinaIntl } from "../../intl/dina-ui-intl";
import { Vocabulary } from "../../types/collection-api";

export interface VocabularySelectFieldProps extends LabelWrapperParams {
  path: string;
  /** Whether this is a multi-select dropdown. */
  isMulti?: boolean;
}

export function VocabularySelectField({
  isMulti,
  path,
  ...fieldWrapperProps
}: VocabularySelectFieldProps) {
  const { response, loading } = useQuery<Vocabulary>({ path });
  const { locale } = useDinaIntl();

  const options =
    response?.data?.vocabularyElements?.map(el => {
      const value = el.labels?.[locale] || el.name || String(el);
      return { label: value, value };
    }) ?? [];

  return (
    <SelectField
      // Re-initialize the component if the options change:
      key={options.map(option => option.label).join()}
      isMulti={isMulti}
      isLoading={loading}
      options={options}
      {...fieldWrapperProps}
    />
  );
}
