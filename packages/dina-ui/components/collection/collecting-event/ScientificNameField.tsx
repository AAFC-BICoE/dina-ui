import {
  FieldWrapperProps,
  TextField,
  useDinaFormContext,
  useElasticSearchQuery
} from "common-ui";
import {
  GlobalNamesReadOnly,
  SelectedScientificNameView
} from "../global-names/GlobalNamesField";
import { useState } from "react";
import AutoSuggest, { InputProps } from "react-autosuggest";
import { noop } from "lodash";
import { Determination } from "packages/dina-ui/types/collection-api/resources/Determination";

export interface ScientificNameFieldProps {
  fieldProps: (fieldName: string) => FieldWrapperProps;
  isManualInput: boolean;
}

export function ScientificNameField({
  fieldProps,
  isManualInput
}: ScientificNameFieldProps) {
  const { readOnly } = useDinaFormContext();

  /** Current search value. */
  const [inputValue, setInputValue] = useState<string>("");

  const [suggestions, setSuggestions] = useState<Determination[]>([]);

  /** Is the textbox selected, this is used to determine if the suggestions should appear. */
  const [focus, setFocus] = useState<boolean>(false);

  useElasticSearchQuery({
    indexName: "dina_material_sample_index",
    queryDSL: {
      query: {
        nested: {
          path: "included",
          query: {
            prefix: {
              "included.attributes.determination.scientificName.keyword": {
                value: inputValue,
                case_insensitive: true
              }
            }
          }
        }
      }
    },
    deps: [inputValue],
    disabled: readOnly,
    onSuccess(response) {
      const suggestionsFound: Determination[] = [];

      const resultsFound = response?.data?.hits?.hits ?? [];
      resultsFound.forEach((elasticSearchHit) => {
        const includedRelationships = elasticSearchHit?._source?.included ?? [];
        includedRelationships
          ?.filter(
            (includedRelationship) => includedRelationship?.type === "organism"
          )
          ?.forEach((organismRelationship) => {
            const determinations =
              organismRelationship?.attributes?.determination ?? [];
            determinations?.forEach((determination) => {
              if (determination?.scientificName?.startsWith(inputValue)) {
                suggestionsFound.push({
                  ...determination
                });
              }
            });
          });
      });

      setSuggestions(suggestionsFound);
    }
  });

  return readOnly ? (
    <>
      <TextField
        {...fieldProps("scientificName")}
        readOnlyRender={(value, _form) => {
          const scientificNameSrcDetailUrlVal = _form.getFieldMeta(
            fieldProps("scientificNameDetails.sourceUrl").name
          ).value as string;
          return (
            <SelectedScientificNameView
              value={value}
              formik={_form}
              scientificNameDetailsField={
                fieldProps("scientificNameDetails").name
              }
              scientificNameSrcDetailUrlVal={scientificNameSrcDetailUrlVal}
            />
          );
        }}
      />
    </>
  ) : (
    <>
      <div className="autosuggest">
        <TextField
          {...fieldProps("scientificName")}
          onChangeExternal={(_form, _, newVal) => {
            if (newVal && newVal?.trim().length > 0) {
              _form.setFieldValue(
                fieldProps("scientificNameSource").name,
                isManualInput ? "CUSTOM" : null
              );
            } else {
              if (!isManualInput) {
                _form.setFieldValue(
                  fieldProps("scientificNameSource").name,
                  null
                );
                _form.setFieldValue(
                  fieldProps("scientificNameDetails").name,
                  null
                );
              }
            }
          }}
          customInput={(props) => {
            const inputProps: InputProps<any> = {
              placeholder: "",
              value: (props.value as string) ?? "",
              onChange: (e, { newValue }) => {
                setInputValue?.(newValue);

                const isBlank = newValue === "";
                props?.onChange?.(
                  isBlank ? ({ target: { value: null } } as any) : e
                );
              },
              autoComplete: "none",
              className: "form-control",
              onFocus: () => setFocus(true),
              onBlur: () => setFocus(false)
            };

            return (
              <AutoSuggest<Determination>
                {...props}
                multiSection={false}
                suggestions={suggestions}
                getSuggestionValue={(s) => s.scientificName ?? ""}
                onSuggestionsFetchRequested={({ value: fetchValue }) =>
                  setInputValue?.(fetchValue)
                }
                // onSuggestionSelected={(_event, data) =>
                //   console.log(data)
                //   // setInputValue?.(data.suggestion)
                // }
                onSuggestionsClearRequested={noop}
                renderSuggestion={(determination) => (
                  <>
                    {determination.scientificNameDetails && (
                      <GlobalNamesReadOnly
                        scientificNameDetails={
                          determination.scientificNameDetails
                        }
                        value={determination.scientificName ?? ""}
                        displayFull={true}
                      />
                    )}
                  </>
                )}
                inputProps={inputProps}
                alwaysRenderSuggestions={focus}
                theme={{
                  suggestionsList: "list-group",
                  suggestion: "list-group-item",
                  suggestionHighlighted: "suggestion-highlighted",
                  suggestionsContainerOpen: "suggestions-container-open",
                  suggestionsContainer: "suggestions-container",
                  container: "autosuggest-container"
                }}
              />
            );
          }}
        />
      </div>
      <hr />
    </>
  );
}
