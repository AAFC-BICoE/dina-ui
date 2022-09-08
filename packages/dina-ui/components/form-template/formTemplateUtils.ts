import { KitsuResource } from "kitsu";
import { FormTemplate } from "packages/dina-ui/types/collection-api";

export function getInitialValuesFromFormTemplate<T extends KitsuResource>(
  formTemplate: Partial<FormTemplate> | undefined
): Partial<T> & { templateCheckboxes?: Record<string, true | undefined> } {
  // No form template data provided. Working on a new form template.
  if (!formTemplate) {
    return {};
  }

  const initialValueForResource: Partial<T> = {};

  return {
    ...initialValueForResource,
    templateCheckboxes: {} as Record<string, true | undefined>,
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
