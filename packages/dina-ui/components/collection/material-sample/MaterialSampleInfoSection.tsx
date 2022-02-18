import {
  AutoSuggestTextField,
  DateField,
  FieldSet,
  FieldSpy,
  filterBy,
  ResourceSelectField,
  TextField,
  useDinaFormContext
} from "common-ui";
import { DinaMessage, useDinaIntl } from "../../..//intl/dina-ui-intl";
import {
  MaterialSample,
  MaterialSampleType
} from "../../..//types/collection-api";
import { Vocabulary } from "../../../types/collection-api";
import { MaterialSampleStateReadOnlyRender } from "../MaterialSampleStateWarning";

export const MATERIALSAMPLE_FIELDSET_FIELDS: (keyof MaterialSample)[] = [
  "materialSampleRemarks",
  "materialSampleState",
  "materialSampleType"
];

export function MaterialSampleInfoSection({ id }: { id: string }) {
  const { locale, formatMessage } = useDinaIntl();

  const { readOnly } = useDinaFormContext();

  const onMaterialSampleStateChanged = (form, _name, value) => {
    if (value === "") {
      form.setFieldValue("stateChangeRemarks", null);
      form.setFieldValue("stateChangedOn", null);
    }
  };

  return (
    <FieldSet id={id} legend={<DinaMessage id="materialSampleInfo" />}>
      <div className="row">
        <div className="col-md-6">
          <ResourceSelectField<MaterialSampleType>
            name="materialSampleType"
            filter={filterBy(["name"])}
            model="collection-api/material-sample-type"
            optionLabel={it => it.name}
            readOnlyLink="/collection/material-sample-type/view?id="
          />
          {!readOnly ? (
            <AutoSuggestTextField<Vocabulary>
              name="materialSampleState"
              query={() => ({
                path: "collection-api/vocabulary/materialSampleState"
              })}
              suggestion={vocabElement =>
                vocabElement?.vocabularyElements?.map(
                  it => it?.labels?.[locale] ?? ""
                ) ?? ""
              }
              alwaysShowSuggestions={true}
              onChangeExternal={onMaterialSampleStateChanged}
            />
          ) : (
            <MaterialSampleStateReadOnlyRender removeLabel={false} />
          )}
        </div>
        <div className="col-md-6">
          <TextField name="materialSampleRemarks" multiLines={true} />
        </div>
      </div>
      {!readOnly && (
        <FieldSpy fieldName="materialSampleState">
          {materialSampleState =>
            materialSampleState ? (
              <div className="row">
                <DateField
                  className="col-md-6"
                  name="stateChangedOn"
                  label={formatMessage("date")}
                />
                <TextField
                  className="col-md-6"
                  name="stateChangeRemarks"
                  multiLines={true}
                  label={formatMessage("additionalRemarks")}
                />
              </div>
            ) : null
          }
        </FieldSpy>
      )}
    </FieldSet>
  );
}
