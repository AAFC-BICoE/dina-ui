import { isDate, isNumber } from "lodash";
import moment from "moment";
import Link from "next/link";
import { FieldWrapper, FieldWrapperProps } from "./FieldWrapper";
import { Fragment } from "react";

/** Renders the label and value of a field from Formik context. */
export function FieldView(props: FieldWrapperProps) {
  return <FieldWrapper {...props} />;
}

export interface ReadOnlyValueProps {
  value: any;
  link?: string;
  bold?: boolean;
}

export function ReadOnlyValue({ value, link, bold }: ReadOnlyValueProps) {
  return (
    <div
      className="field-view"
      style={{ whiteSpace: "pre-wrap", fontWeight: bold ? "bold" : undefined }}
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

          return (
            <Fragment key={idx}>
              {idx <= value.length - 2 ? displayString + ", " : displayString}
            </Fragment>
          );
        })
      ) : typeof value === "string" ? (
        value
      ) : isDate(value) ? (
        moment(value).format()
      ) : isNumber(value) ? (
        value.toString()
      ) : value ? (
        JSON.stringify(value)
      ) : null}
    </div>
  );
}
