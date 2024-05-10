import {
  COLLECTING_EVENT_COMPONENT_NAME,
  SPLIT_CONFIGURATION_COMPONENT_NAME,
  FormTemplate,
  MATERIAL_SAMPLE_INFO_COMPONENT_NAME,
  ORGANISMS_COMPONENT_NAME,
  FormTemplateSectionItem
} from "../../types/collection-api";
import { sortBy, get, isEmpty, compact } from "lodash";
import { SplitConfiguration } from "../../types/collection-api/resources/SplitConfiguration";

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

export function getComponentArrayValues(
  comp: string,
  formTemplate: FormTemplate | undefined,
  invisibleUndefined: boolean
) {
  let componentValues: any;
  const templateCheckboxes: Record<string, true | undefined> = {};
  if (formTemplate) {
    formTemplate.components?.forEach((component) => {
      if (component.name === comp) {
        if (component.visible) {
          const valuableItems: FormTemplateSectionItem[] = [];
          component.sections?.forEach((section) => {
            section.items?.forEach((item) => {
              if (item.name && (item.visible || item.defaultValue)) {
                valuableItems.push(item);
                templateCheckboxes[
                  component.name + "." + section.name + "." + item.name
                ] = true;
              }
            });
          });
          componentValues = buildObjectFromArray(valuableItems);
        }
      }
    });
  }

  if (
    invisibleUndefined &&
    isEmpty(componentValues) &&
    isEmpty(templateCheckboxes)
  ) {
    return undefined;
  }
  return { componentValues, templateCheckboxes };
}

function buildObjectFromArray(data?: FormTemplateSectionItem[]) {
  if (!data) {
    return undefined;
  }

  const obj: any = {};
  data.forEach((item) => {
    const path = item.name!;
    const value = item.defaultValue;
    const segments = path.split(".");
    let current = obj;

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      const isArray = /\[\d+\]/.test(segment);

      if (isArray) {
        const [key, index] = segment.split(/\[|\]/).filter(Boolean); // remove null or undefined items
        current[key] = current[key] || [];
        if (!current[key][index]) {
          if (i === segments.length - 1) {
            current[key][index] = value;
          } else {
            current[key][index] = {};
          }
        }
        current = current[key][index];
      } else {
        if (i === segments.length - 1) {
          current[segment] = value;
        } else {
          current[segment] = current[segment] || {};
        }
        current = current[segment];
      }
    }
  });

  return obj;
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
        }
      }
    });
  }

  if (
    invisibleUndefined &&
    isEmpty(componentValues) &&
    isEmpty(templateCheckboxes)
  ) {
    return undefined;
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
        component.name !== SPLIT_CONFIGURATION_COMPONENT_NAME &&
        component.name !== ORGANISMS_COMPONENT_NAME
      ) {
        if (component.visible) {
          component.sections?.forEach((section) => {
            section.items?.forEach((item) => {
              if (item.name && item.visible) {
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
    const ogsmComponentValues = getComponentArrayValues(
      ORGANISMS_COMPONENT_NAME,
      formTemplate,
      true
    );
    ret = {
      ...componentValues,
      ...ogsmComponentValues?.componentValues,
      templateCheckboxes: {
        ...templateCheckboxes,
        ...ogsmComponentValues?.templateCheckboxes
      }
    };
  }
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

  // Retrieve form template identifiers to get the material sample type.
  const materialSampleInfoInitialValues = getComponentValues(
    MATERIAL_SAMPLE_INFO_COMPONENT_NAME,
    formTemplate,
    true
  );

  const splitConfigurationStrategy = get(
    splitConfigurationInitialValues,
    "splitConfiguration.materialSampleNameGeneration.strategy"
  );

  const materialSampleType =
    splitConfigurationStrategy === "TYPE_BASED"
      ? get(materialSampleInfoInitialValues, "materialSampleType")
      : undefined;

  // Return an empty object to be put into the form template default values.
  if (!splitConfigurationInitialValues) {
    return undefined;
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
        strategy: splitConfigurationStrategy,
        characterType: get(
          splitConfigurationInitialValues,
          "splitConfiguration.materialSampleNameGeneration.characterType"
        ),
        materialSampleType
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

/**
 * After fetching all of the form templates a user has access to, this function will filter out all
 * of the form templates that do not have split configuration setup.
 *
 * An additional filter is added for the condition on the split configuration.
 *
 * @param templates All form templates the user can have access to.
 * @param materialSampleType The split from Material Sample Type used for the condition.
 */
export function getSplitConfigurationFormTemplates(
  templates?: FormTemplate[],
  materialSampleType?: string
): FormTemplate[] {
  if (!templates || !materialSampleType) return [];

  return templates.filter((template) => {
    const splitConfigComponent = getComponentValues(
      SPLIT_CONFIGURATION_COMPONENT_NAME,
      template,
      true
    );

    // Split configuration does not exist on this form template.
    if (!splitConfigComponent) {
      return false;
    }

    // Check the split configuration condition.
    if (
      splitConfigComponent["splitConfiguration.condition.conditionType"] ===
        "TYPE_BASED" &&
      splitConfigComponent[
        "splitConfiguration.condition.materialSampleType"
      ].includes(materialSampleType)
    ) {
      return true;
    }

    // Condition not met, do not include it.
    return false;
  });
}
