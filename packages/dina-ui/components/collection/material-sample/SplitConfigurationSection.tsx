import {
  ControlledVocabularySelectField,
  FieldSet,
  FieldSpy,
  SelectField
} from "common-ui";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { SPLIT_CONFIGURATION_COMPONENT_NAME } from "../../../types/collection-api";

export interface SplitConfigurationSectionProps {
  id?: string;
}

export function SplitConfigurationSection({
  id
}: SplitConfigurationSectionProps) {
  const { formatMessage } = useDinaIntl();

  return (
    <FieldSet
      id={id}
      legend={<DinaMessage id="materialSampleSplitConfiguration" />}
      componentName={SPLIT_CONFIGURATION_COMPONENT_NAME}
    >
      {/* Condition Fields */}
      <FieldSet
        id="split-configuration-condition-section"
        legend={<DinaMessage id="materialSampleSplitConfigurationCondition" />}
        sectionName="split-configuration-condition-section"
        className="non-strip"
      >
        <div className="row">
          <div className="col-md-6">
            <SelectField
              name="splitConfiguration.condition.conditionType"
              label={formatMessage(
                "materialSampleSplitConfigurationConditionType"
              )}
              disableTemplateCheckbox={true}
              options={[
                {
                  value: "type",
                  label: formatMessage("field_materialSampleType")
                }
              ]}
            />
          </div>
          <div className="col-md-6">
            <FieldSpy fieldName="splitConfiguration.condition.conditionType">
              {(selected) => (
                <ControlledVocabularySelectField
                  name="splitConfiguration.condition.materialSampleType"
                  label={formatMessage("field_materialSampleType")}
                  disableTemplateCheckbox={true}
                  disabled={selected !== "type"}
                  query={() => ({
                    path: "collection-api/vocabulary/materialSampleType"
                  })}
                  isMulti={true}
                />
              )}
            </FieldSpy>
          </div>
        </div>
      </FieldSet>

      {/* Basename Generation Fields */}
      <FieldSet
        id="split-configuration-basename-section"
        legend={<DinaMessage id="materialSampleSplitConfigurationBasename" />}
        sectionName="split-configuration-basename-section"
        className="non-strip"
      >
        <div className="row">
          <div className="col-md-6">
            <SelectField
              name="splitConfiguration.basename.generateFrom"
              label={formatMessage(
                "materialSampleSplitConfigurationGenerateFrom"
              )}
              disableTemplateCheckbox={true}
              options={[
                {
                  value: "direct_parent",
                  label: formatMessage(
                    "materialSampleSplitConfigurationDirectParent"
                  )
                },
                {
                  value: "type",
                  label: formatMessage("field_materialSampleType")
                }
              ]}
            />
          </div>
          <div className="col-md-6">
            <FieldSpy fieldName="splitConfiguration.basename.generateFrom">
              {(selected) => (
                <ControlledVocabularySelectField
                  name="splitConfiguration.basename.materialSampleType"
                  label={formatMessage("field_materialSampleType")}
                  disableTemplateCheckbox={true}
                  disabled={selected !== "type"}
                  query={() => ({
                    path: "collection-api/vocabulary/materialSampleType"
                  })}
                  isMulti={true}
                />
              )}
            </FieldSpy>
          </div>
        </div>
      </FieldSet>

      {/* Sequence Generation Fields */}
      <FieldSet
        id="split-configuration-sequence-generation-section"
        legend={
          <DinaMessage id="materialSampleSplitConfigurationSequenceGeneration" />
        }
        sectionName="split-configuration-sequence-generation-section"
        className="non-strip"
      >
        <div className="row">
          <div className="col-md-6">
            <SelectField
              name="splitConfiguration.sequenceGeneration.generateFrom"
              label={formatMessage(
                "materialSampleSplitConfigurationGenerateFrom"
              )}
              disableTemplateCheckbox={true}
              options={[
                {
                  value: "direct_parent",
                  label: formatMessage(
                    "materialSampleSplitConfigurationDirectParent"
                  )
                },
                {
                  value: "type",
                  label: formatMessage("field_materialSampleType")
                }
              ]}
            />
          </div>
          <div className="col-md-6">
            <FieldSpy fieldName="splitConfiguration.sequenceGeneration.generateFrom">
              {(selected) => (
                <ControlledVocabularySelectField
                  name="splitConfiguration.sequenceGeneration.materialSampleType"
                  label={formatMessage("field_materialSampleType")}
                  disableTemplateCheckbox={true}
                  disabled={selected !== "type"}
                  query={() => ({
                    path: "collection-api/vocabulary/materialSampleType"
                  })}
                  isMulti={true}
                />
              )}
            </FieldSpy>
          </div>
        </div>
        <div className="row">
          <div className="col-md-6">
            <SelectField
              name="splitConfiguration.sequenceGeneration.generationOptions"
              label={formatMessage("splitGenerationOptionLabel")}
              disableTemplateCheckbox={true}
              options={[
                {
                  value: "lowercase",
                  label: formatMessage("splitGenerationOptionLowercase")
                },
                {
                  value: "uppercase",
                  label: formatMessage("splitGenerationOptionUppercase")
                },
                {
                  value: "numeric",
                  label: formatMessage("splitGenerationOptionNumerical")
                }
              ]}
            />
          </div>
        </div>
      </FieldSet>
    </FieldSet>
  );
}
