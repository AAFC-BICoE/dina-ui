import {
  ControlledVocabularySelectField,
  FieldSet,
  FieldSpy,
  SelectField
} from "common-ui";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import {
  FormTemplate,
  FormTemplateComponents,
  SPLIT_CONFIGURATION_COMPONENT_NAME
} from "../../../types/collection-api";
import {
  TYPE_BASED_STRATEGY,
  DIRECT_PARENT_STRATEGY,
  LOWER_CHARACTER_TYPE,
  UPPER_CHARACTER_TYPE,
  NUMBER_CHARACTER_TYPE
} from "../../../types/collection-api/resources/SplitConfiguration";
import { isUndefined, isEmpty, merge } from "lodash";

export interface SplitConfigurationSectionProps {
  id?: string;
}

/**
 * Perform split configuration validation. The following rules are applied:
 *
 * - Check for required fields.
 * - Check for Material Sample Type if that is the condition Type.
 * - Material Sample Type is required.
 *
 * This function will only be called if the data component "Split Configuration" is enabled.
 */
export function onValidateSplitConfiguration(
  values: FormTemplate & FormTemplateComponents,
  errors: any,
  formatMessage: any
) {
  // Create a new object to hold any new errors we find
  const newErrors: any = {};

  // Condition Type is required.
  if (isUndefined(values?.splitConfiguration?.condition?.conditionType)) {
    newErrors.splitConfiguration = merge(newErrors.splitConfiguration, {
      condition: { conditionType: formatMessage("requiredField") }
    });
  } else {
    // If condition type is `Material Sample Type` then the Material Sample Type field is required.
    if (
      values.splitConfiguration?.condition.conditionType ===
        TYPE_BASED_STRATEGY &&
      isEmpty(values?.splitConfiguration?.condition?.materialSampleType)
    ) {
      newErrors.splitConfiguration = merge(newErrors.splitConfiguration, {
        condition: {
          materialSampleType: formatMessage("requiredField")
        }
      });
    }
  }

  // Strategy is required.
  if (
    isUndefined(
      values?.splitConfiguration?.materialSampleNameGeneration?.strategy
    )
  ) {
    newErrors.splitConfiguration = merge(newErrors.splitConfiguration, {
      materialSampleNameGeneration: {
        strategy: formatMessage("requiredField")
      }
    });
  } else {
    // If strategy is `Material Sample Type` then the Material Sample Type field is required.
    if (
      values.splitConfiguration?.materialSampleNameGeneration.strategy ===
      TYPE_BASED_STRATEGY
    ) {
      // Material Sample Type is required when doing a split configuration.
      if (isEmpty(values?.materialSampleType)) {
        newErrors.materialSampleType = formatMessage(
          "materialSampleSplitConfigurationRequiredMaterialSampleType"
        );
      }

      // Also must be visible on the form.
      if (
        isUndefined(
          values?.templateCheckboxes[
            "material-sample-info-component.material-sample-info-section.materialSampleType"
          ]
        ) ||
        values?.templateCheckboxes[
          "material-sample-info-component.material-sample-info-section.materialSampleType"
        ] === false
      ) {
        newErrors.materialSampleType = formatMessage(
          "materialSampleSplitConfigurationVisibleMaterialSampleType"
        );
      }
    }
  }

  // Character Type is required.
  if (
    isUndefined(
      values?.splitConfiguration?.materialSampleNameGeneration?.characterType
    )
  ) {
    newErrors.splitConfiguration = merge(newErrors.splitConfiguration, {
      materialSampleNameGeneration: {
        characterType: formatMessage("requiredField")
      }
    });
  }

  // Merge the new errors into the existing errors object
  return merge(errors, newErrors);
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
                  value: TYPE_BASED_STRATEGY,
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
                  disabled={selected !== TYPE_BASED_STRATEGY}
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
        id="split-configuration-material-sample-name-generation-section"
        legend={
          <DinaMessage id="materialSampleSplitConfigurationMaterialSampleNameGeneration" />
        }
        sectionName="split-configuration-material-sample-name-generation-section"
        className="non-strip"
      >
        <div className="row">
          <div className="col-md-6">
            <SelectField
              name="splitConfiguration.materialSampleNameGeneration.strategy"
              label={formatMessage("materialSampleSplitConfigurationStrategy")}
              disableTemplateCheckbox={true}
              options={[
                {
                  value: DIRECT_PARENT_STRATEGY,
                  label: formatMessage(
                    "materialSampleSplitConfigurationDirectParent"
                  )
                },
                {
                  value: TYPE_BASED_STRATEGY,
                  label: formatMessage("field_materialSampleType")
                }
              ]}
            />
          </div>
          <div className="col-md-6">
            <SelectField
              name="splitConfiguration.materialSampleNameGeneration.characterType"
              label={formatMessage("splitGenerationOptionLabel")}
              disableTemplateCheckbox={true}
              options={[
                {
                  value: LOWER_CHARACTER_TYPE,
                  label: formatMessage("splitGenerationOptionLowercase")
                },
                {
                  value: UPPER_CHARACTER_TYPE,
                  label: formatMessage("splitGenerationOptionUppercase")
                },
                {
                  value: NUMBER_CHARACTER_TYPE,
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
