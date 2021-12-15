import { get, isEqual } from "lodash";
import { isBlankResourceAttribute, useBulkEditTabContext } from "..";

export interface UseBulkEditTabFieldParams {
  fieldName: string;
}

export function useBulkEditTabField({ fieldName }: UseBulkEditTabFieldParams) {
  const bulkEditCtx = useBulkEditTabContext();

  if (!bulkEditCtx) {
    return null;
  }

  const { sampleHooks, bulkEditFormRef } = bulkEditCtx;

  const hasBulkEditValue = !isBlankResourceAttribute(
    get(bulkEditFormRef.current?.values, fieldName)
  );

  const formStates = sampleHooks.map(sample => sample.formRef?.current?.values);

  const hasNoValues = formStates.every(form =>
    isBlankResourceAttribute(get(form, fieldName))
  );

  const hasDifferentValues = !formStates.every(form =>
    isEqual(
      get(form, fieldName),
      get(sampleHooks[0].formRef?.current?.values, fieldName)
    )
  );

  const hasSameValues = !hasDifferentValues;

  const commonValue =
    hasSameValues && !hasNoValues ? get(formStates[0], fieldName) : undefined;

  return {
    hasNoValues,
    hasDifferentValues,
    hasSameValues,
    hasBulkEditValue,
    commonValue
  };
}
