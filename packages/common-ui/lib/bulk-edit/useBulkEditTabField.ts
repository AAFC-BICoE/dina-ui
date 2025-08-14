import classNames from "classnames";
import { isBlankResourceAttribute, useBulkEditTabContext } from "common-ui";
import _ from "lodash";
import { useIntl } from "react-intl";
import { BulkEditTabContextI } from "./bulk-context";

export interface UseBulkEditTabFieldParams {
  fieldName: string;
  currentValue?: any;
}

export function useBulkEditTabField(params: UseBulkEditTabFieldParams) {
  const bulkEditCtx = useBulkEditTabContext();

  if (!bulkEditCtx) {
    return null;
  }

  return getBulkEditTabFieldInfo({ bulkEditCtx, ...params });
}

export interface BulkEditTabFieldInfoParams {
  bulkEditCtx: BulkEditTabContextI;
  fieldName: string;
  currentValue?: any;
}

export function getBulkEditTabFieldInfo(params: BulkEditTabFieldInfoParams) {
  const {
    bulkEditCtx: { bulkEditFormRef, resourceHooks: sampleHooks, clearedFields },
    fieldName
  } = params;

  const formStates = sampleHooks.map(
    (sample) => sample.formRef.current?.values
  );

  const hasNoValues = formStates.every((form) =>
    isBlankResourceAttribute(_.get(form, fieldName))
  );

  let commonValue: any;
  const hasMultipleValues = !formStates.every((form) => {
    const bulkValue = _.get(form, fieldName);
    const sampleValue = _.get(
      sampleHooks[0].formRef.current?.values,
      fieldName
    );
    if (fieldName.includes("extensionValues") && fieldName.includes("type")) {
      if (
        (isBlankResourceAttribute(bulkValue) &&
          !isBlankResourceAttribute(sampleValue)) ||
        (!isBlankResourceAttribute(bulkValue) &&
          isBlankResourceAttribute(sampleValue))
      ) {
        commonValue = bulkValue ?? sampleValue;
        return true;
      }
    }
    // Treat different types of blank values the same e.g. null, "", empty array:
    return _.isEqual(
      isBlankResourceAttribute(bulkValue) ? null : bulkValue,
      isBlankResourceAttribute(sampleValue) ? null : sampleValue
    );
  });

  const hasSameValues = !hasMultipleValues;
  commonValue =
    commonValue ??
    (hasSameValues && !hasNoValues
      ? _.get(formStates[0], fieldName)
      : undefined);

  const bulkEditValue =
    "currentValue" in params
      ? params.currentValue
      : _.get(bulkEditFormRef.current?.values, fieldName);

  const hasBulkEditValue =
    !isBlankResourceAttribute(bulkEditValue) &&
    !_.isEqual(bulkEditValue, commonValue);

  const isExplicitlyCleared = clearedFields?.has(fieldName) || false;

  return {
    hasNoValues,
    hasMultipleValues,
    hasSameValues,
    hasBulkEditValue,
    isExplicitlyCleared,
    commonValue
  };
}

/**
 * Gets the data to show indicators in the bulk edit tab's fields.
 */
export function useBulkEditTabFieldIndicators(
  params: UseBulkEditTabFieldParams
) {
  const field = useBulkEditTabField(params);
  const { formatMessage } = useIntl();

  if (field) {
    const {
      hasMultipleValues,
      hasSameValues,
      commonValue,
      hasBulkEditValue,
      isExplicitlyCleared
    } = field;

    const placeholder = isExplicitlyCleared
      ? formatMessage({ id: "cleared" })
      : hasMultipleValues
      ? formatMessage({ id: "multipleValues" })
      : undefined;

    const defaultValue = hasSameValues ? commonValue : undefined;

    const bulkEditClasses = classNames(
      hasBulkEditValue && "has-bulk-edit-value",
      hasMultipleValues && "has-multiple-values",
      isExplicitlyCleared && "is-explicitly-cleared"
    );

    const showClearIcon =
      hasMultipleValues && !hasBulkEditValue && !isExplicitlyCleared;

    return {
      placeholder,
      defaultValue,
      bulkEditClasses,
      hasBulkEditValue,
      showClearIcon,
      isExplicitlyCleared
    };
  }

  return null;
}
