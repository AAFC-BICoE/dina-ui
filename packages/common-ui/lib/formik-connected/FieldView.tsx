import { FastField, FieldProps } from "formik";
import Link from "next/link";
import { FieldWrapper, LabelWrapperParams } from "./FieldWrapper";

export interface FieldViewProps extends LabelWrapperParams {
  link?: string;
}

/** Renders the label and value of a field from Formik context. */
export function FieldView(props: FieldViewProps) {
  const { link, name } = props;

  return (
    <FastField name={name}>
      {({ field: { value } }: FieldProps) => (
        <FieldWrapper {...props}>
          <p
            style={{
              borderBottom: "1px solid black",
              borderRight: "1px solid black",
              minHeight: "25px"
            }}
          >
            {link ? (
              <Link href={link}>
                <a>{value}</a>
              </Link>
            ) : Array.isArray(value) ? (
              value
                .map(val => (val.name ? val.name : JSON.stringify(val)))
                .join()
            ) : (
              value
            )}
          </p>
        </FieldWrapper>
      )}
    </FastField>
  );
}
