import {
  COLLECTING_EVENT_COMPONENT_NAME,
  FormTemplate,
  ORGANISMS_COMPONENT_NAME,
  FormTemplateSectionItem
} from "../../types/collection-api";
import _ from "lodash";

export function getFormTemplateCheckboxes(
  formTemplate: Partial<FormTemplate> | undefined
) {
  // No form template data provided. Working on a new form template.
  if (!formTemplate) {
    return {};
  }

  const templateCheckboxesValues: Record<string, true | undefined> = {};

  formTemplate.components?.forEach((component) => {
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
    _.isEmpty(componentValues) &&
    _.isEmpty(templateCheckboxes)
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
    _.isEmpty(componentValues) &&
    _.isEmpty(templateCheckboxes)
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

  return _.sortBy(template.components, "order").map<string>(
    (component) => component.name ?? ""
  );
}
