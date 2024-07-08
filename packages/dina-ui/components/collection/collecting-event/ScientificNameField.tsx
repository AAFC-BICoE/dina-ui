import {
  FieldWrapperProps,
  TextField,
  useDinaFormContext,
  useElasticSearchQuery
} from "common-ui";
import { SelectedScientificNameView } from "../global-names/GlobalNamesField";
import { useState } from "react";

export interface ScientificNameFieldProps {
  fieldProps: (fieldName: string) => FieldWrapperProps;
  isManualInput: boolean;
}

export function ScientificNameField({
  fieldProps,
  isManualInput
}: ScientificNameFieldProps) {
  const { readOnly } = useDinaFormContext();

  const [inputValue, setInputValue] = useState<string>("");

  useElasticSearchQuery({
    indexName: "dina_material_sample_index",
    queryDSL: {
      query: {
        nested: {
          path: "included",
          query: {
            prefix: {
              "included.attributes.determination.scientificName.keyword":
                inputValue
            }
          }
        }
      }
    },
    deps: [inputValue],
    onSuccess(response) {
      // console.log(response);
    }
  });

  return (
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
        onChangeExternal={(_form, _, newVal) => {
          if (newVal && newVal?.trim().length > 0) {
            setInputValue(newVal);
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
      />
      {!readOnly && <hr />}
    </>
  );
}
