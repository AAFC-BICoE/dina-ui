import { isBlankResourceAttribute, useBulkEditTabContext } from "common-ui";
import { compact, get, isEqual } from "lodash";
import { useIntl } from "react-intl";
import classNames from "classnames";

export interface UseBulkEditTabFieldParams {
  fieldName: string;
  currentValue?: any;
}

export function useBulkEditTabField({
  fieldName,
  currentValue
}: UseBulkEditTabFieldParams) {
  const bulkEditCtx = useBulkEditTabContext();

  if (!bulkEditCtx) {
    return null;
  }

  const { sampleHooks, bulkEditFormRef } = bulkEditCtx;

  const formStates = sampleHooks.map(sample => sample.formRef.current?.values);

  const hasNoValues = formStates.every(form =>
    isBlankResourceAttribute(get(form, fieldName))
  );

  const hasMultipleValues = !formStates.every(form =>
    isEqual(
      get(form, fieldName),
      get(sampleHooks[0].formRef.current?.values, fieldName)
    )
  );

  const hasSameValues = !hasMultipleValues;

  const commonValue =
    hasSameValues && !hasNoValues ? get(formStates[0], fieldName) : undefined;

  const bulkEditValue =
    currentValue !== undefined
      ? currentValue
      : get(bulkEditFormRef.current?.values, fieldName);

  const hasBulkEditValue =
    !isBlankResourceAttribute(bulkEditValue) &&
    !isEqual(bulkEditValue, commonValue);

  return {
    hasNoValues,
    hasMultipleValues,
    hasSameValues,
    hasBulkEditValue,
    commonValue
  };
}

/**
 * Gets the data to show indicators in the bulk edit tab's fields.
 */
export function useBulkEditTabFieldIndicators({
  fieldName,
  currentValue
}: UseBulkEditTabFieldParams) {
  const field = useBulkEditTabField({ fieldName, currentValue });
  const { formatMessage } = useIntl();

  if (field) {
    const { hasMultipleValues, hasSameValues, commonValue, hasBulkEditValue } =
      field;

    const placeholder = hasMultipleValues
      ? formatMessage({ id: "multipleValues" })
      : undefined;

    const defaultValue =
      hasSameValues && !hasBulkEditValue ? commonValue : undefined;

    const bulkEditClasses = classNames(
      hasBulkEditValue && "has-bulk-edit-value",
      hasMultipleValues && "has-multiple-values"
    );

    return { placeholder, defaultValue, bulkEditClasses };
  }

  return null;
}
