import { Head, Nav } from "packages/dina-ui/components";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { FieldArray } from "formik";
import { StepRow } from "packages/dina-ui/components/thermocycler-profile/StepRow";
import {
  DinaForm,
  EditButton,
  FieldSet,
  FormikButton
} from "packages/common-ui/lib";
import Button from "react-bootstrap/Button";

export default function FieldEditPage() {
  const { formatMessage } = useDinaIntl();
  return (
    <div>
      <Head title={formatMessage("extensionListTitle")} />
      <FieldSet
        legend={<DinaMessage id="dataEntryLabel" />}
        wrapLegend={(legend) => {
          return (
            <div className="d-flex align-items-center justify-content-between">
              {legend}
              <Button>Add</Button>
            </div>
          );
        }}
      >
        <DinaForm initialValues={{ steps: [""] }}>
          <FieldArray name="steps">
            {(fieldArrayProps) => {
              const elements: [] = fieldArrayProps.form.values.steps;

              function addRow() {
                fieldArrayProps.push(
                  <StepRow
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
                      <StepRow
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
      </FieldSet>
    </div>
  );
}
