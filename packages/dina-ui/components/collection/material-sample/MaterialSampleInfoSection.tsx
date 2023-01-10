import {
  AutoSuggestTextField,
  ControlledVocabularySelectField,
  DateField,
  FieldSet,
  FieldSpy,
  TextField,
  useDinaFormContext
} from "common-ui";
import { DinaMessage, useDinaIntl } from "../../..//intl/dina-ui-intl";
import {
  MaterialSample,
  MATERIAL_SAMPLE_INFO_COMPONENT_NAME
} from "../../..//types/collection-api";
import { Vocabulary } from "../../../types/collection-api";
import { MaterialSampleStateReadOnlyRender } from "../MaterialSampleStateWarning";
import { find, compact } from "lodash";

export const MATERIALSAMPLE_FIELDSET_FIELDS: (keyof MaterialSample)[] = [
  "materialSampleRemarks",
  "materialSampleState",
  "materialSampleType"
];

export function MaterialSampleInfoSection({ id }: { id?: string }) {
  const { locale, formatMessage } = useDinaIntl();

  const { readOnly } = useDinaFormContext();

  const onMaterialSampleStateChanged = (form, _name, value) => {
    if (value === "") {
      form.setFieldValue("stateChangeRemarks", null);
      form.setFieldValue("stateChangedOn", null);
    }
  };

  return (
    <FieldSet
      id={id}
      legend={<DinaMessage id="materialSampleInfo" />}
      componentName={MATERIAL_SAMPLE_INFO_COMPONENT_NAME}
      sectionName="material-sample-info-section"
    >
      <div className="row">
        <div className="col-md-6">
          <ControlledVocabularySelectField
            name="materialSampleType"
            query={() => ({
              path: "collection-api/vocabulary/materialSampleType"
            })}
          />
          {!readOnly ? (
            <AutoSuggestTextField<Vocabulary>
              name="materialSampleState"
              jsonApiBackend={{
                query: () => ({
                  path: "collection-api/vocabulary/materialSampleState"
                }),
                option: (vocabElement) =>
                  compact(
                    vocabElement?.vocabularyElements?.map(
                      (it) =>
                        find(
                          it?.multilingualTitle?.titles || [],
                          (item) => item.lang === locale
                        )?.title ||
                        it.name ||
                        ""
                    ) ?? []
                  )
              }}
              blankSearchBackend={"json-api"}
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
          {(materialSampleState) =>
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
