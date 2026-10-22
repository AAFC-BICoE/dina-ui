import {
  AutoSuggestTextField,
  ControlledVocabularySelectField,
  DateField,
  DinaFormSection,
  FieldSet,
  FieldSpy,
  INLINE_LABEL_WIDTH,
  TextField,
  ToggleField,
  useDinaFormContext
} from "common-ui";
import { DinaMessage, useDinaIntl } from "../../..//intl/dina-ui-intl";
import {
  MANAGED_ATTRIBUTES_COMPONENT_NAME,
  MaterialSample,
  MATERIAL_SAMPLE_INFO_COMPONENT_NAME
} from "../../..//types/collection-api";
import { Vocabulary } from "../../../types/collection-api";
import { MaterialSampleStateReadOnlyRender } from "../MaterialSampleStateWarning";
import _ from "lodash";
import { ManagedAttributesEditor } from "../../managed-attributes/ManagedAttributesEditor";
import { VisibleManagedAttributesConfig } from "./MaterialSampleForm";

export const MATERIALSAMPLE_FIELDSET_FIELDS: (keyof MaterialSample)[] = [
  "materialSampleRemarks",
  "materialSampleState",
  "materialSampleType"
];

export function MaterialSampleInfoSection({ id }: { id?: string }) {
  const { locale, formatMessage } = useDinaIntl();

  const { readOnly, isTemplate } = useDinaFormContext();

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
      horizontal={INLINE_LABEL_WIDTH}
      compact={true}
    >
      <ControlledVocabularySelectField
        name="materialSampleType"
        query={() => ({
          path: "collection-api/vocabulary2/materialSampleType"
        })}
      />
      {!readOnly ? (
        <AutoSuggestTextField<Vocabulary>
          name="materialSampleState"
          jsonApiBackend={{
            query: () => ({
              path: "collection-api/vocabulary2/materialSampleState"
            }),
            option: (vocabElement) =>
              _.compact(
                vocabElement?.vocabularyElements?.map(
                  (it) =>
                    _.find(
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
      {!isTemplate && (
        <ToggleField
          name="isBaseForSplitByType"
          disableTemplateCheckbox={true}
        />
      )}
      <TextField name="materialSampleRemarks" multiLines={true} />
      {!readOnly && (
        <FieldSpy fieldName="materialSampleState">
          {(materialSampleState) =>
            materialSampleState ? (
              <>
                <DateField
                  name="stateChangedOn"
                  label={formatMessage("date")}
                />
                <TextField
                  name="stateChangeRemarks"
                  multiLines={true}
                  label={formatMessage("additionalRemarks")}
                />
              </>
            ) : null
          }
        </FieldSpy>
      )}
    </FieldSet>
  );
}

export function MaterialSampleInfoManagedAttributes({
  id,
  visibleManagedAttributeKeys
}: {
  id?: string;
  visibleManagedAttributeKeys?: VisibleManagedAttributesConfig;
}) {
  const { readOnly } = useDinaFormContext();

  if (!readOnly) {
    return null;
  }

  return (
    <DinaFormSection
      componentName={MANAGED_ATTRIBUTES_COMPONENT_NAME}
      sectionName="managed-attributes-section"
    >
      <div className="row">
        <div className="col-md-12">
          <ManagedAttributesEditor
            valuesPath="managedAttributes"
            managedAttributeApiPath="collection-api/controlled-vocabulary-item"
            managedAttributeComponent="MATERIAL_SAMPLE"
            fieldSetProps={{
              id,
              legend: <DinaMessage id="materialSampleManagedAttributes" />
            }}
            managedAttributeOrderFieldName="managedAttributesOrder"
            visibleAttributeKeys={visibleManagedAttributeKeys?.materialSample}
            disableClearButton={true}
            isControlledVocabulary={true}
          />
        </div>
      </div>
    </DinaFormSection>
  );
}
