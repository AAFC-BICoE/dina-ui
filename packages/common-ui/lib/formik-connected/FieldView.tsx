import { FastField, FieldProps } from "formik";
import { isDate, isNumber } from "lodash";
import moment from "moment";
import Link from "next/link";
import { FieldWrapper, LabelWrapperParams } from "./FieldWrapper";

export interface FieldViewProps extends LabelWrapperParams {
  link?: string;
  arrayItemLink?: string;
}

/** Renders the label and value of a field from Formik context. */
export function FieldView(props: FieldViewProps) {
  const { link, name, arrayItemLink } = props;

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
              value.map((val, idx) => {
                const displayString = val.name
                  ? val.name
                  : val.displayName
                  ? val.displayName
                  : val.names
                  ? val.names[0].name
                  : typeof val === "string"
                  ? val
                  : JSON.stringify(val);

                return arrayItemLink ? (
                  <>
                    <Link href={arrayItemLink + val.id} key={val.id}>
                      <a>{displayString}</a>
                    </Link>
                    {idx <= value.length - 2 && <span>, </span>}
                  </>
                ) : idx <= value.length - 2 ? (
                  displayString + ","
                ) : (
                  displayString
                );
              })
            ) : typeof value === "string" ? (
              value
            ) : isDate(value) ? (
              moment(value).format()
            ) : isNumber(value) ? (
              value.toString()
            ) : null}
          </p>
        </FieldWrapper>
      )}
    </FastField>
  );
}
