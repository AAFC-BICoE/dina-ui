import { FastField, FastFieldProps } from "formik";
import { get, isEqual } from "lodash";
import { ReactNode } from "react";
import { isBlankResourceAttribute, useBulkEditTabFieldIndicators } from "..";

export interface FieldSpyProps {
  fieldName: string;
  children: (value: any, fieldProps: FieldSpyRenderProps) => ReactNode;
  validate?: (value: any) => string | void;
}

export interface FieldSpyRenderProps extends FastFieldProps {
  bulkContext: ReturnType<typeof useBulkEditTabFieldIndicators>;
}

/**
 * Renders the value (or bulk edit common/default value).
 * Re-renders on value update or when the parent component renders.
 */
export function FieldSpy({ fieldName, children, validate }: FieldSpyProps) {
  function shouldRender(next, prev) {
    const formStateChanged = ["values", "errors", "touched"].some(
      formikStateField =>
        !isEqual(
          get(prev.formik[formikStateField], fieldName),
          get(next.formik[formikStateField], fieldName)
        )
    );

    const isRenderFromParent = next.children !== prev.children;

    return formStateChanged || isRenderFromParent;
  }

  return (
    <FastField name={fieldName} shouldUpdate={shouldRender} validate={validate}>
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
