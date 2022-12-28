import { DataRow, VocabularySelectField } from "packages/dina-ui/components";
import { FieldArray } from "formik";
import {
  DinaForm,
  FieldHeader,
  SelectField,
  SelectOption
} from "packages/common-ui/lib";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";

export interface DataBlockProps {
  index?: number;
  options?: any[];
  vocabularyOptionsPath?: string;
  /** The model type to select resources from. */
  model: string;
  unitsOptions?: any[];
}

export function DataBlock({
  options,
  vocabularyOptionsPath,
  model,
  unitsOptions
}: DataBlockProps) {
  const { formatMessage } = useDinaIntl();

  return (
    <div>
      <div className="d-flex align-items-center">
        {options && <SelectField options={options} name={"select"} />}
        {vocabularyOptionsPath && (
          <VocabularySelectField path={vocabularyOptionsPath} name={"select"} />
        )}
        <DinaMessage id="dataType" />
        <DinaMessage id="dataValue" />
        {unitsOptions && <DinaMessage id="unit" />}
      </div>
      <FieldArray name="steps">
        {(fieldArrayProps) => {
          const steps: [] = fieldArrayProps.form.values.steps;

          function addRow() {
            fieldArrayProps.push(
              <DataRow
                readOnly={false}
                name={fieldArrayProps.name}
                index={steps?.length ?? 0}
                removeRow={removeRow}
                addRow={addRow}
                model={model}
              />
            );
          }

          function removeRow(index) {
            fieldArrayProps.remove(index);
          }

          const showPlusIcon = steps.length < 5;
          const column1 = (
            <div className="card card-body col-md-4">
              {steps.slice(0, 5).map((_, index) => {
                return (
                  <DataRow
                    readOnly={false}
                    showPlusIcon={showPlusIcon}
                    name={fieldArrayProps.name}
                    key={index}
                    index={index}
                    addRow={addRow}
                    removeRow={removeRow}
                    model={model}
                  />
                );
              })}
            </div>
          );

          return steps?.length > 0 ? (
            <div className="card-group row" style={{ padding: 15 }}>
              {column1}
            </div>
          ) : null;
        }}
      </FieldArray>
    </div>
  );
}
