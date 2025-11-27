import _ from "lodash";
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
  isExternalLink?: boolean;
}

export function ReadOnlyValue({
  value,
  link,
  bold,
  isExternalLink
}: ReadOnlyValueProps) {
  return (
    <div
      className="field-view"
      style={{ whiteSpace: "pre-wrap", fontWeight: bold ? "bold" : undefined }}
    >
      {link ? (
        isExternalLink ? (
          <a href={link} target="_blank" rel="noopener noreferrer">
            {value}
          </a>
        ) : (
          <Link href={link}>{value}</Link>
        )
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
      ) : _.isDate(value) ? (
        moment(value).format()
      ) : _.isNumber(value) ? (
        value.toString()
      ) : value ? (
        JSON.stringify(value)
      ) : null}
    </div>
  );
}
