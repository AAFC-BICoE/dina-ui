import { FastField, FastFieldProps } from "formik";
import { get, isEqual } from "lodash";
import { ReactNode } from "react";
import { isBlankResourceAttribute, useBulkEditTabFieldIndicators } from "..";

export interface FieldSpyProps {
  fieldName: string;
  children: (value: any, fieldProps: FieldSpyRenderProps) => ReactNode;
}

export interface FieldSpyRenderProps extends FastFieldProps {
  bulkContext: ReturnType<typeof useBulkEditTabFieldIndicators>;
}

/**
 * Renders the value (or bulk edit common/default value).
 * Re-renders on value update or when the parent component renders.
 */
export function FieldSpy({ fieldName, children }: FieldSpyProps) {
  function shouldRender(next, prev) {
    const valueChanged = !isEqual(
      get(prev.formik.values, fieldName),
      get(next.formik.values, fieldName)
    );

    const isRenderFromParent = next.children !== prev.children;

    return valueChanged || isRenderFromParent;
  }

  return (
    <FastField name={fieldName} shouldUpdate={shouldRender}>
      {(fastFieldProps: FastFieldProps) => (
        <FieldSpyInternal fastFieldProps={fastFieldProps} fieldName={fieldName}>
          {children}
        </FieldSpyInternal>
      )}
    </FastField>
  );
}

interface FieldSpyInternalProps {
  fastFieldProps: FastFieldProps;
  fieldName: string;
  children: (value: any, fieldProps: FieldSpyRenderProps) => ReactNode;
}

function FieldSpyInternal({
  fastFieldProps,
  fieldName,
  children
}: FieldSpyInternalProps) {
  const formikValue = fastFieldProps.field.value;

  const bulkContext = useBulkEditTabFieldIndicators({
    fieldName,
    currentValue: formikValue
  });

  const value =
    bulkContext && isBlankResourceAttribute(formikValue)
      ? bulkContext?.defaultValue
      : formikValue;

  return <>{children(value, { ...fastFieldProps, bulkContext })}</>;
}
