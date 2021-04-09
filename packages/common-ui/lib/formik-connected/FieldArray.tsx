import { FieldArray as FormikFieldArray, FieldArrayConfig } from "formik";
import { useDinaFormContext } from "./DinaForm";

/** Wrapper around formik's FieldArray. */
export function FieldArray(props: FieldArrayConfig) {
  const { namePrefix } = useDinaFormContext();

  /** Prefixed field name for nested form section. */
  const prefixedFieldName = [namePrefix, props.name].filter(it => it).join(".");

  return <FormikFieldArray {...props} name={prefixedFieldName} />;
}
