import { FastField, FastFieldProps } from "formik";
import _ from "lodash";
import { ReactNode } from "react";
import { isBlankResourceAttribute, useBulkEditTabFieldIndicators } from "..";

export interface FieldSpyProps<T> {
  fieldName: string;
  children: (
    value: T | null | undefined,
    fieldProps: FieldSpyRenderProps
  ) => ReactNode;
  validate?: (value: any) => string | void;
}

export interface FieldSpyRenderProps extends FastFieldProps {
  bulkContext: ReturnType<typeof useBulkEditTabFieldIndicators>;
  isChanged: boolean;
}

/**
 * Renders the value (or bulk edit common/default value).
 * Re-renders on value update or when the parent component renders.
 */
export function FieldSpy<T = unknown>({
  fieldName,
  children,
  validate
}: FieldSpyProps<T>) {
  function shouldRender(next, prev) {
    const formStateChanged = ["values", "errors", "touched"].some(
      (formikStateField) =>
        !_.isEqual(
          _.get(prev.formik[formikStateField], fieldName),
          _.get(next.formik[formikStateField], fieldName)
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

interface FieldSpyInternalProps<T> {
  fastFieldProps: FastFieldProps;
  fieldName: string;
  children: (
    value: T | null | undefined,
    fieldProps: FieldSpyRenderProps
  ) => ReactNode;
}

function FieldSpyInternal<T>({
  fastFieldProps,
  fieldName,
  children
}: FieldSpyInternalProps<T>) {
  const formikValue = fastFieldProps.field.value;
  const { initialValue } = fastFieldProps.meta;

  const bulkContext = useBulkEditTabFieldIndicators({
    fieldName,
    currentValue: formikValue
  });

  const isChanged = !_.isEqual(
    isBlankResourceAttribute(formikValue) ? null : formikValue,
    isBlankResourceAttribute(initialValue) ? null : initialValue
  );

  const value =
    bulkContext && isBlankResourceAttribute(formikValue)
      ? bulkContext?.defaultValue
      : formikValue;

  return <>{children(value, { ...fastFieldProps, bulkContext, isChanged })}</>;
}
