import { DataRow, VocabularySelectField } from "packages/dina-ui/components";
import { FieldArray } from "formik";
import {
  DinaForm,
  FieldHeader,
  SelectField,
  SelectOption
} from "packages/common-ui/lib";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";
import Button from "react-bootstrap/Button";

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

          return (
            <div>
              {steps?.length > 0 ? (
                <div className="border" style={{ padding: 15 }}>
                  <div className="d-inline-flex align-items-center">
                    {options && (
                      <SelectField
                        options={options}
                        name={"select"}
                        customName={""}
                      />
                    )}
                    {vocabularyOptionsPath && (
                      <VocabularySelectField
                        path={vocabularyOptionsPath}
                        name={"select"}
                        customName={""}
                      />
                    )}
                    <div>
                      <DinaMessage id="dataType" />
                    </div>
                    <div>
                      <DinaMessage id="dataValue" />
                    </div>

                    {unitsOptions && (
                      <div>
                        <DinaMessage id="unit" />
                      </div>
                    )}
                  </div>
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
                  <Button>Delete</Button>
                </div>
              ) : null}
            </div>
          );
        }}
      </FieldArray>
    </div>
  );
}
