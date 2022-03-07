import { FieldWrapperProps, useApiClient } from "..";
import { ESIndexMapping, QueryRow } from "./QueryRow";
import { FieldArray } from "formik";
import moment from "moment";

interface QueryBuilderProps extends FieldWrapperProps {
  esIndexMapping?: ESIndexMapping[];
  isResetRef?: React.MutableRefObject<boolean>;
}
export function QueryBuilder({
  name,
  esIndexMapping,
  isResetRef
}: QueryBuilderProps) {
  return (
    <FieldArray name={name}>
      {fieldArrayProps => {
        const elements: [] = fieldArrayProps.form.values.queryRows;

        function addRow() {
          fieldArrayProps.push(
            <QueryRow
              name={fieldArrayProps.name}
              esIndexMapping={esIndexMapping as any}
              index={elements?.length ?? 0}
              removeRow={removeRow}
              addRow={addRow}
              isResetRef={isResetRef}
            />
          );
          // initialize the logic switch value to be "and"//
          fieldArrayProps.form.setFieldValue(
            `${fieldArrayProps.name}[${
              elements?.length ?? 0
            }].compoundQueryType`,
            "and"
          );

          fieldArrayProps.form.setFieldValue(
            `${fieldArrayProps.name}[${elements?.length ?? 0}].fieldName`,
            esIndexMapping?.[0]?.label
          );
          fieldArrayProps.form.setFieldValue(
            `${fieldArrayProps.name}[${elements?.length ?? 0}].matchType`,
            "match"
          );

          fieldArrayProps.form.setFieldValue(
            `${fieldArrayProps.name}[${elements?.length ?? 0}].boolean`,
            "true"
          );

          fieldArrayProps.form.setFieldValue(
            `${fieldArrayProps.name}[${elements?.length ?? 0}].date`,
            moment().format()
          );
        }

        function removeRow(index) {
          fieldArrayProps.remove(index);
        }

        return elements?.length > 0
          ? elements?.map((_, index) => (
              <QueryRow
                name={fieldArrayProps.name}
                key={index}
                index={index}
                addRow={addRow}
                removeRow={removeRow}
                esIndexMapping={esIndexMapping as any}
                isResetRef={isResetRef}
              />
            ))
          : null;
      }}
    </FieldArray>
  );
}
