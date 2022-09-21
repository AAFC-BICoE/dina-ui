import { filterBy, ResourceSelectField, TextField } from "common-ui";
import { GroupSelectField } from "..";
import { Region } from "../../types/seqdb-api/resources/Region";
import { FieldArray } from "formik";
import { StepRow } from "./StepRow";

export interface ThermocyclerProfileFormFieldsProps {
  readOnly: boolean;
}

export function ThermocyclerProfileFormFields({
  readOnly
}: ThermocyclerProfileFormFieldsProps) {
  return (
    <div>
      <div className="row">
        <GroupSelectField
          className="col-md-2"
          name="group"
          enableStoredDefaultGroup={true}
        />
      </div>
      <div className="row">
        <ResourceSelectField<Region>
          className="col-md-2"
          name="region"
          filter={filterBy(["name"])}
          label="Gene Region"
          model="seqdb-api/region"
          optionLabel={(region) => region.name}
        />
        <TextField
          className="col-md-2"
          name="name"
          label="Thermocycler Profile Name"
        />
        <TextField className="col-md-2" name="application" />
        <TextField className="col-md-2" name="cycles" />
      </div>
      <div className="row">
        <div className="col-md-6">
          <div>
            <FieldArray name="steps">
              {(fieldArrayProps) => {
                const elements: [] = fieldArrayProps.form.values.steps;

                function addRow() {
                  fieldArrayProps.push(
                    <StepRow
                      readOnly={readOnly}
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

                const showPlusIcon = elements.length < 15;
                const column1 = (
                  <div className="card card-body col-md-4">
                    {elements.slice(0, 5).map((_, index) => {
                      return (
                        <StepRow
                          readOnly={readOnly}
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
                const column2 = (
                  <div className="card card-body col-md-4">
                    {elements.slice(5, 10).map((_, index) => {
                      return (
                        <StepRow
                          readOnly={readOnly}
                          showPlusIcon={showPlusIcon}
                          name={fieldArrayProps.name}
                          key={index + 5}
                          index={index + 5}
                          addRow={addRow}
                          removeRow={removeRow}
                        />
                      );
                    })}
                  </div>
                );
                const column3 = (
                  <div className="card card-body col-md-4">
                    {elements.slice(10, 15).map((_, index) => {
                      return (
                        <StepRow
                          readOnly={readOnly}
                          showPlusIcon={showPlusIcon}
                          name={fieldArrayProps.name}
                          key={index + 10}
                          index={index + 10}
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
                    {column2}
                    {column3}
                  </div>
                ) : null;
              }}
            </FieldArray>
          </div>
        </div>
      </div>
    </div>
  );
}
