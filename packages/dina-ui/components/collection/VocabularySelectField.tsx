import { FieldWrapper, LabelWrapperParams, useQuery } from "common-ui";
import { castArray } from "lodash";
import { GroupBase } from "react-select";
import CreatableSelect, { CreatableProps } from "react-select/creatable";
import { useDinaIntl } from "../../intl/dina-ui-intl";
import { Vocabulary, VocabularyElement } from "../../types/collection-api";

export interface VocabularySelectFieldProps extends LabelWrapperParams {
  path: string;
  isMulti?: boolean;
  selectProps?: Partial<
    CreatableProps<VocabularyOption, true, GroupBase<VocabularyOption>>
  >;
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
  isMulti,
  ...labelWrapperProps
}: VocabularySelectFieldProps) {
  const { formatMessage } = useDinaIntl();
  const { loading, toOption, vocabOptions } = useVocabularyOptions({ path });

  return (
    <FieldWrapper
      // Re-initialize the component if the labels change:
      key={vocabOptions.map(option => option.label).join()}
      readOnlyRender={value => (
        <VocabularyReadOnlyView path={path} value={value} />
      )}
      {...labelWrapperProps}
    >
      {({ setValue, value, invalid }) => {
        const selectValue =
          value &&
          (Array.isArray(value) ? value.map(toOption) : toOption(value));

        function setFormValue(
          selected: VocabularyOption | VocabularyOption[] | null
        ) {
          const newValue = Array.isArray(selected)
            ? selected.map(option => option.value)
            : selected?.value;

          setValue(newValue);
        }

        return (
          <div className={invalid ? "is-invalid" : ""}>
            <CreatableSelect<VocabularyOption, boolean>
              isClearable={true}
              options={vocabOptions}
              isLoading={loading}
              isMulti={isMulti}
              onChange={setFormValue}
              value={selectValue}
              formatCreateLabel={inputValue => `Add "${inputValue}"`}
              placeholder={formatMessage("selectOrType")}
              styles={{
                control: base => ({
                  ...base,
                  ...(invalid && {
                    borderColor: "rgb(148, 26, 37)",
                    "&:hover": { borderColor: "rgb(148, 26, 37)" }
                  })
                })
              }}
              {...selectProps}
            />
          </div>
        );
      }}
    </FieldWrapper>
  );
}

/** Gets the vocab options from the back-end. */
function useVocabularyOptions({ path }) {
  const { response, loading } = useQuery<Vocabulary>({ path });
  const { locale } = useDinaIntl();

  const vocabOptions = response?.data?.vocabularyElements?.map(toOption) ?? [];

  function toOption(value: string | VocabularyElement): VocabularyOption {
    if (typeof value === "string") {
      return {
        label: vocabOptions.find(it => it.value === value)?.label || value,
        value
      };
    }
    const label = value.labels?.[locale] || value.name || String(value);
    return { label, value: value.name || label };
  }

  return { toOption, loading, vocabOptions };
}

/** Shows the values or labels if available. */
export function VocabularyReadOnlyView({ path, value }) {
  const { toOption } = useVocabularyOptions({ path });

  return value ? (
    <div>
      {castArray(value)
        .map(text => toOption(text).label)
        .join(", ")}
    </div>
  ) : null;
}
