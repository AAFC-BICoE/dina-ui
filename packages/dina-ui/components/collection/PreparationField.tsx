import {
  DateField,
  FieldSet,
  filterBy,
  ResourceSelectField,
  TextField
} from "common-ui";
import { Field } from "formik";
import { InputResource } from "kitsu";
import { DinaMessage } from "../../intl/dina-ui-intl";
import { Person } from "../../types/agent-api";
import {
  MaterialSample,
  MaterialSampleType,
  PreparationType
} from "../../types/collection-api";

export interface PreparationFieldProps {
  className?: string;
  namePrefix?: string;
}

/**
 * List of field names in the PreparationField component.
 * This should be updated when fields are added or removed in the PreparationField component.
 */
export const PREPARATION_FIELDS = [
  "materialSampleType",
  "preparationType",
  "preparationDate",
  "preparedBy",
  "preparationRemarks"
] as const;

/** Blank values for all Preparation fields. */
export const BLANK_PREPARATION: Required<
  Pick<InputResource<MaterialSample>, typeof PREPARATION_FIELDS[number]>
> = Object.seal({
  materialSampleType: Object.seal({ id: null, type: "material-sample-type" }),
  preparationType: Object.seal({ id: null, type: "preparation-type" }),
  preparationDate: null,
  preparedBy: Object.seal({ id: null, type: "person" }),
  preparationRemarks: null
});

export function PreparationField({
  className,
  namePrefix = ""
}: PreparationFieldProps) {
  return (
    <FieldSet
      className={className}
      id="preparations-section"
      legend={<DinaMessage id="preparations" />}
    >
      <div className="row">
        <ResourceSelectField<MaterialSampleType>
          name={`${namePrefix}materialSampleType`}
          customName="materialSampleType"
          className="col-sm-6"
          filter={filterBy(["name"])}
          model="collection-api/material-sample-type"
          optionLabel={it => it.name}
          readOnlyLink="/collection/material-sample-type/view?id="
        />
        <ResourceSelectField<Person>
          name={`${namePrefix}preparedBy`}
          customName="preparedBy"
          className="col-sm-6"
          filter={filterBy(["displayName"])}
          model="agent-api/person"
          optionLabel={person => person.displayName}
          readOnlyLink="/person/view?id="
        />
        <div className="preparation-type col-sm-6">
          <Field name={`${namePrefix}preparationType`}>
            {({ form: { values } }) => (
              <ResourceSelectField<PreparationType>
                name={`${namePrefix}preparationType`}
                customName="preparationType"
                model="collection-api/preparation-type"
                optionLabel={it => it.name}
                readOnlyLink="/collection/preparation-type/view?id="
                filter={input =>
                  values.group
                    ? {
                        ...filterBy(["name"])(input),
                        group: { EQ: `${values.group}` }
                      }
                    : { ...filterBy(["name"])(input) }
                }
                key={values.group}
              />
            )}
          </Field>
        </div>
        <DateField
          name={`${namePrefix}preparationDate`}
          customName="preparationDate"
          className="col-sm-6"
        />
        <TextField
          name={`${namePrefix}preparationRemarks`}
          customName="preparationRemarks"
          multiLines={true}
        />
      </div>
    </FieldSet>
  );
}
