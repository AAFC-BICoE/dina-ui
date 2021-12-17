import classNames from "classnames";
import {
  isBlankResourceAttribute,
  SampleWithHooks,
  useBulkEditTabContext
} from "common-ui";
import { FormikProps } from "formik";
import { InputResource } from "kitsu";
import { get, isEqual } from "lodash";
import { RefObject } from "react";
import { useIntl } from "react-intl";
import type { MaterialSample } from "../../../dina-ui/types/collection-api/resources/MaterialSample";

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

  return getBulkEditTabFieldInfo(
    bulkEditCtx.bulkEditFormRef,
    bulkEditCtx.sampleHooks,
    fieldName,
    currentValue
  );
}

export function getBulkEditTabFieldInfo(
  bulkEditFormRef: RefObject<FormikProps<InputResource<MaterialSample>>>,
  sampleHooks: SampleWithHooks[],
  fieldName: string,
  currentValue?: any
) {
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
