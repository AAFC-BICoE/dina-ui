import { InputResource, KitsuResource } from "kitsu";
import { FormTemplate } from "packages/dina-ui/types/collection-api";

interface GetInitialValuesFromFormTemplateProps {
  /**
   * The form template to search under to find the initial values.
   */
  formTemplate?: Partial<FormTemplate>;

  componentName?: string;

  sectionName?: string;

  /**
   * Before returning the value, this function can be used to do final checks.
   */
  finalTransformations?: (initialValues: any) => any;
}

export function getInitialValuesFromFormTemplate<T extends KitsuResource>({
  formTemplate,
  componentName,
  sectionName,
  finalTransformations
}: GetInitialValuesFromFormTemplateProps): Partial<T> & {
  templateCheckboxes?: Record<string, true | undefined>;
} {
  // No form template data provided. Working on a new form template.
  if (!formTemplate) {
    return finalTransformations?.({}) ?? {};
  }

  const initialValueForResource: Partial<T> = {};

  // if (componentName) {
  // }

  return {
    ...initialValueForResource,
    templateCheckboxes: {} as Record<string, true | undefined>,
    attachmentsConfig: {}
  };
}
