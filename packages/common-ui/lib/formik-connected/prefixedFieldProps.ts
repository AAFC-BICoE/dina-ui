import { FieldWrapperProps } from "./FieldWrapper";

/**
 * Builds field props for a field nested inside an object or array field.
 *
 * FieldWrapper looks up labels and tooltips with the full field name
 * ("field_usageRights.licenseName"), so nested fields need customName set to the
 * short name to keep using the plain "field_licenseName" message key.
 *
 * @param prefix the path to the containing object, e.g. "usageRights" or "keywordSets[0]"
 * @param templateCheckboxPrefix path used for the form-template checkbox, when the
 * prefix is an array element. Pointing every element at the first element's
 * checkbox means enabling the first one enables them all.
 */
export function prefixedFieldProps(
  prefix: string,
  templateCheckboxPrefix?: string
) {
  return (fieldName: string): FieldWrapperProps => ({
    name: `${prefix}.${fieldName}`,
    customName: fieldName,
    ...(templateCheckboxPrefix && {
      templateCheckboxFieldName: `${templateCheckboxPrefix}.${fieldName}`
    })
  });
}
