import { FastField, FastFieldProps } from "formik";
import { ReactNode } from "react";
import { isBlankResourceAttribute, useBulkEditTabFieldIndicators } from "..";

export interface FieldSpyProps {
  fieldName: string;
  children: (value: any, fastFieldProps: FastFieldProps) => ReactNode;
}

/** Renders the value (or bulk edit common/default value). Re-renders on value update. */
export function FieldSpy({ fieldName, children }: FieldSpyProps) {
  const bulkCtx = useBulkEditTabFieldIndicators({ fieldName });

  return (
    <FastField name={fieldName}>
      {(ffProps: FastFieldProps) => {
        const value =
          bulkCtx && isBlankResourceAttribute(ffProps.field.value)
            ? bulkCtx?.defaultValue
            : ffProps.field.value;

        return children(value, ffProps);
      }}
    </FastField>
  );
}
