import { find } from "lodash";
import {
  FormTemplate,
  FormTemplateComponent,
  FormTemplateSection,
  FormTemplateSectionItem
} from "../../../dina-ui/types/collection-api";

/**
 * Helper function to get a data component from a form template.
 *
 * @param formTemplate The whole form template structure.
 * @param componentName The component name to search under the form template components.
 * @returns If a result is found, the FormTemplateComponent type. Otherwise, undefined.
 */
export function getFormTemplateComponent(
  formTemplate: FormTemplate | undefined,
  componentName: string | undefined
): FormTemplateComponent | undefined {
  if (!formTemplate || !componentName) return undefined;

  return find(formTemplate?.components, {
    name: componentName
  });
}

/**
 * Helper function to get a data component from a form template.
 *
 * @param formTemplate The whole form template structure.
 * @param componentName The component name to search under the form template components.
 * @param sectionName The section name to search under the component.
 * @returns If a result is found, the FormTemplateComponent type. Otherwise, undefined.
 */
export function getFormTemplateSection(
  formTemplate: FormTemplate | undefined,
  componentName: string | undefined,
  sectionName: string | undefined
): FormTemplateSection | undefined {
  if (!formTemplate || !componentName || !sectionName) return undefined;

  const componentFound = getFormTemplateComponent(formTemplate, componentName);
  if (componentFound) {
    return find(componentFound?.sections, {
      name: sectionName
    });
  }

  return undefined;
}

/**
 * Helper function to search through a form template to the get the form template item.
 *
 * @param formTemplate The whole form template structure.
 * @param componentName The component name to search under the form template components.
 * @param sectionName The section name to search under the component.
 * @param fieldName The field name to search under the section.
 * @returns If a result is found, the FormTemplateSectionItem type. Otherwise, undefined.
 */
export function getFormTemplateField(
  formTemplate: FormTemplate | undefined,
  componentName: string | undefined,
  sectionName: string | undefined,
  fieldName: string | undefined
): FormTemplateSectionItem | undefined {
  if (!formTemplate || !componentName || !sectionName || !fieldName)
    return undefined;

  // Next find the right section.
  const sectionFound = getFormTemplateSection(
    formTemplate,
    componentName,
    sectionName
  );
  if (sectionFound) {
    // Finally, find the field in the section.
    return (
      find(sectionFound.items, {
        name: fieldName
      }) ?? undefined
    );
  }
}
