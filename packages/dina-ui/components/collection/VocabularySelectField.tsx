import { FieldWrapper, LabelWrapperParams, useQuery } from "common-ui";
import CreatableSelect, {
  Props as CreatableSelectProps
} from "react-select/creatable";
import { useDinaIntl } from "../../intl/dina-ui-intl";
import { Vocabulary } from "../../types/collection-api";

export interface VocabularySelectFieldProps extends LabelWrapperParams {
  path: string;
  selectProps?: Partial<CreatableSelectProps<VocabularyOption, true>>;
}

export interface VocabularyOption {
  label: string;
  value: string;
}

/**
 * Multi-select field backed by the vocabulary endpoint.
 * Allows the user to add options not found from the list.
 */
export function VocabularySelectField({
  path,
  selectProps,
  ...labelWrapperProps
}: VocabularySelectFieldProps) {
  const { response, loading } = useQuery<Vocabulary>({ path });
  const { locale } = useDinaIntl();

  const options =
    response?.data?.vocabularyElements?.map(el => {
      const value = el.labels?.[locale] || el.name || String(el);
      return { label: value, value };
    }) ?? [];

  function toOption(value: string): VocabularyOption {
    return { label: value, value };
  }

  return (
    <FieldWrapper
      // Re-initialize the component if the labels change:
      key={options.map(option => option.label).join()}
      {...labelWrapperProps}
    >
      {({ setValue, value }) => {
        const selectValue = (
          value
            ? String(value)
                .split(",")
                .map(val => val.trim())
            : []
        ).map(toOption);

        function setAsStringValue(selected: VocabularyOption[]) {
          setValue(selected.map(option => option.value).join(", "));
        }

        return (
          <CreatableSelect<VocabularyOption, true>
            isClearable={true}
            options={options}
            isLoading={loading}
            isMulti={true}
            onChange={setAsStringValue}
            value={selectValue}
            formatCreateLabel={inputValue => `Add "${inputValue}"`}
            {...selectProps}
          />
        );
      }}
    </FieldWrapper>
  );
}
