import { DataRow, VocabularySelectField } from "packages/dina-ui/components";
import { FieldArray } from "formik";
import { DinaForm, FieldHeader, SelectField } from "packages/common-ui/lib";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";

export interface DataBlockProps {
  index?: number;
}

export function DataBlock({}: DataBlockProps) {
  const { formatMessage } = useDinaIntl();
  const options = [
    { label: "Image", value: "IMAGE" },
    { label: "Moving Image", value: "MOVING_IMAGE" },
    { label: "Sound", value: "SOUND" },
    { label: "Text", value: "TEXT" },
    { label: "Dataset", value: "DATASET" },
    { label: "Undetermined", value: "UNDETERMINED" }
  ];
  return (
    <DinaForm initialValues={{ steps: [""], select: {} }}>
      <div className="d-flex align-items-center">
        <SelectField options={options} name={"select"} />
        <DinaMessage id="dataType" />
        <DinaMessage id="dataValue" />
      </div>
      <FieldArray name="steps">
        {(fieldArrayProps) => {
          const elements: [] = fieldArrayProps.form.values.steps;

          function addRow() {
            fieldArrayProps.push(
              <DataRow
                readOnly={false}
                name={fieldArrayProps.name}
                index={elements?.length ?? 0}
                removeRow={removeRow}
                addRow={addRow}
              />
            );
          }

          function removeRow(index) {
            fieldArrayProps.remove(index);
          }

          const showPlusIcon = elements.length < 5;
          const column1 = (
            <div className="card card-body col-md-4">
              {elements.slice(0, 5).map((_, index) => {
                return (
                  <DataRow
                    readOnly={false}
                    showPlusIcon={showPlusIcon}
                    name={fieldArrayProps.name}
                    key={index}
                    index={index}
                    addRow={addRow}
                    removeRow={removeRow}
                  />
                );
              })}
            </div>
          );

          return elements?.length > 0 ? (
            <div className="card-group row" style={{ padding: 15 }}>
              {column1}
            </div>
          ) : null;
        }}
      </FieldArray>
    </DinaForm>
  );
}
