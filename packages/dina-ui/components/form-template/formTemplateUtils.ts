import {
  ACQUISITION_EVENT_COMPONENT_NAME,
  COLLECTING_EVENT_COMPONENT_NAME,
  FormTemplate,
  FormTemplateComponent,
  FormTemplateSectionItem
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
    component.sections?.forEach((sections) => {
      sections.items?.forEach((item) => {
        if (item.name && item.visible) {
          templateCheckboxesValues[item.name] = item.visible ? true : undefined;
        }
      });
    });
  });

  return {
    templateCheckboxes: templateCheckboxesValues
  };
}

export function getComponentValues(
  comp: string,
  formTemplate: FormTemplate | undefined
): any {
  const componentValues = {};
  const templateCheckboxes: Record<string, true | undefined> = {};
  let ret = {};
  if (formTemplate) {
    formTemplate.components?.forEach((component) => {
      if (component.name === comp && component.visible) {
        component.sections?.forEach((sections) => {
          sections.items?.forEach((item) => {
            if (
              (item.name && item.visible) ||
              item.name === "geoReferenceAssertions"
            ) {
              componentValues[item.name] = item.defaultValue;
              templateCheckboxes[item.name] = true;
            }
          });
        });
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
        component.name !== ACQUISITION_EVENT_COMPONENT_NAME
      ) {
        if (component.visible) {
          component.sections?.forEach((sections) => {
            sections.items?.forEach((item) => {
              if ((item.name && item.visible) || item.name === "organism") {
                componentValues[item.name] = item.defaultValue;
                templateCheckboxes[item.name] = true;
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
 * Retrieve field information using lodash get function to navigate the tree to retrieve the field
 * information.
 *
 * @param template The form template to search against.
 * @param componentName The data component name.
 * @param sectionName The section name within the component.
 * @param fieldName The field name within the section.
 * @returns FormTemplateSectionItem if found, undefined if not.
 */
export function getFieldFromFormTemplate(
  formTemplateComponents: FormTemplateComponent[],
  componentName: string,
  sectionName: string,
  fieldName: string
): FormTemplateSectionItem | undefined {
  return get(
    formTemplateComponents,
    [componentName, sectionName, fieldName].join(",")
  ) as FormTemplateSectionItem;
}
