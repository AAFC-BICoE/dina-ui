import {
  ACQUISITION_EVENT_COMPONENT_NAME,
  COLLECTING_EVENT_COMPONENT_NAME,
  SPLIT_CONFIGURATION_COMPONENT_NAME,
  FormTemplate
} from "../../types/collection-api";
import { sortBy, get } from "lodash";

export function getFormTemplateCheckboxes(
  formTemplate: Partial<FormTemplate> | undefined
) {
  // No form template data provided. Working on a new form template.
  if (!formTemplate) {
    return {};
  }

  const templateCheckboxesValues: Record<string, true | undefined> = {};

  formTemplate.components?.forEach((component) => {
    // Split configuration does not have visibility.
    if (component.name === SPLIT_CONFIGURATION_COMPONENT_NAME) {
      return;
    }

    component.sections?.forEach((section) => {
      section.items?.forEach((item) => {
        if (item.name && item.visible) {
          templateCheckboxesValues[
            component.name + "." + section.name + "." + item.name
          ] = item.visible ? true : undefined;
        }
      });
    });
  });

  return {
    templateCheckboxes: templateCheckboxesValues
  };
}

/**
 * Using the form template provided, retrieve all of the sections/fields for a specific component.
 *
 * @param comp The component name to search against.
 * @param formTemplate The form template settings to search against.
 * @param invisibleUndefined If the component is not visible (user switched it off) then it will
 *  return undefined if this option is true.
 */
export function getComponentValues(
  comp: string,
  formTemplate: FormTemplate | undefined,
  invisibleUndefined: boolean
): any {
  const componentValues = {};
  const templateCheckboxes: Record<string, true | undefined> = {};
  let ret = {};

  if (formTemplate) {
    formTemplate.components?.forEach((component) => {
      if (component.name === comp) {
        if (component.visible) {
          component.sections?.forEach((section) => {
            section.items?.forEach((item) => {
              if (
                (item.name && item.visible) ||
                item.name === "geoReferenceAssertions"
              ) {
                componentValues[item.name] = item.defaultValue;
                templateCheckboxes[
                  component.name + "." + section.name + "." + item.name
                ] = true;
              }
            });
          });
        } else if (invisibleUndefined) {
          return undefined;
        }
      }
    });
  }

  ret = { ...componentValues, templateCheckboxes };

  return ret;
}

export function getMaterialSampleComponentValues(
  formTemplate: FormTemplate | undefined
): any {
  const componentValues = { group: formTemplate?.group };
  const templateCheckboxes: Record<string, true | undefined> = {};
  let ret = {};
  if (formTemplate) {
    formTemplate.components?.forEach((component) => {
      if (
        component.name !== COLLECTING_EVENT_COMPONENT_NAME &&
        component.name !== ACQUISITION_EVENT_COMPONENT_NAME &&
        component.name !== SPLIT_CONFIGURATION_COMPONENT_NAME
      ) {
        if (component.visible) {
          component.sections?.forEach((section) => {
            section.items?.forEach((item) => {
              if ((item.name && item.visible) || item.name === "organism") {
                componentValues[item.name] = item.defaultValue;
                templateCheckboxes[
                  component.name + "." + section.name + "." + item.name
                ] = true;
              }
            });
          });
        }
      }
    });
  }
  ret = { ...componentValues, templateCheckboxes };
  return ret;
}

export function getSplitConfigurationComponentValues(
  formTemplate: FormTemplate | undefined
): any {
  // Retrieve form template split configuration info.
  const splitConfigurationInitialValues = getComponentValues(
    SPLIT_CONFIGURATION_COMPONENT_NAME,
    formTemplate,
    true
  );

  // Return an empty object to be put into the form template default values.
  if (!splitConfigurationInitialValues) {
    return {};
  }

  // Transform form template info into a Split Configuration object.
  return {
    splitConfiguration: {
      condition: {
        conditionType: get(
          splitConfigurationInitialValues,
          "splitConfiguration.condition.conditionType"
        ),
        materialSampleType: get(
          splitConfigurationInitialValues,
          "splitConfiguration.condition.materialSampleType"
        )
      },
      materialSampleNameGeneration: {
        strategy: get(
          splitConfigurationInitialValues,
          "splitConfiguration.materialSampleNameGeneration.strategy"
        ),
        characterType: get(
          splitConfigurationInitialValues,
          "splitConfiguration.materialSampleNameGeneration.characterType"
        )
      }
    }
  };
}

/**
 * Removes arrays from paths. This is useful for checking if a form template field matches.
 *
 * Example:
 *
 * organisms[1].determination[2].fieldName --> organisms.determination.fieldName
 * organisms[2].determination[3].fieldName --> organisms.determination.fieldName
 *
 * For visibility, it applies to the fieldName even if there is multiple versions of it. In the case
 * above, both are talking about the same fieldName.
 *
 * @param path string json path.
 * @returns json path with arrays removed for checking if the fieldName is a match.
 */
export function removeArraysFromPath(path: string): string {
  return path.replace(/ *\[[^\]]*]/g, "");
}

/**
 * Using the form template components, return a string array of the ids of the data components in
 * the correct order stored in the template.
 *
 * @param template Loaded form template.
 * @returns string array of the component ids in the specific order. Null if nothing can be retrieved.
 */
export function getComponentOrderFromTemplate(
  template?: FormTemplate
): string[] | null {
  if (!template || !template.components) {
    return null;
  }

  return sortBy(template.components, "order").map<string>(
    (component) => component.name ?? ""
  );
}
