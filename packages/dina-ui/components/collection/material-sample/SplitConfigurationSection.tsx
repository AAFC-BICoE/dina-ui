import {
  ControlledVocabularySelectField,
  FieldSet,
  SelectField
} from "common-ui";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { SPLIT_CONFIGURATION_COMPONENT_NAME } from "../../../types/collection-api";
import { FaEquals } from "react-icons/fa";

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
            <ControlledVocabularySelectField
              name="splitConfiguration.condition.materialSampleType"
              label={formatMessage("field_materialSampleType")}
              disableTemplateCheckbox={true}
              query={() => ({
                path: "collection-api/vocabulary/materialSampleType"
              })}
              isMulti={true}
            />
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
          <div className="col-md-6" />
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
          <div className="col-md-6" />
        </div>
      </FieldSet>
    </FieldSet>
  );
}
