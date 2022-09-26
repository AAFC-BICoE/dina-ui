import { KitsuResource } from "kitsu";
import { FormTemplate } from "packages/dina-ui/types/collection-api";
import { sortBy } from "lodash";

export function getInitialValuesFromFormTemplate<T extends KitsuResource>(
  formTemplate: Partial<FormTemplate> | undefined
): Partial<T> & { templateCheckboxes?: Record<string, true | undefined> } {
  // No form template data provided. Working on a new form template.
  if (!formTemplate) {
    return {};
  }

  let templateCheckboxesValues: Record<string, true | undefined> = {};

  formTemplate.components?.forEach((component) => {
    component.sections?.forEach((sections) => {
      sections.items?.forEach((item) => {
        if (item.name) {
          templateCheckboxesValues = {
            ...templateCheckboxesValues,
            ...{ [item.name]: item.visible ? true : undefined }
          };
        }
      });
    });
  });

  const initialValueForResource: Partial<T> = {};

  return {
    ...initialValueForResource,
    templateCheckboxes: templateCheckboxesValues,
    attachmentsConfig: {}
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
