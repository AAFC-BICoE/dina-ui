import { isDate, isNumber } from "lodash";
import moment from "moment";
import Link from "next/link";
import { FieldWrapper, LabelWrapperParams } from "./FieldWrapper";

/** Renders the label and value of a field from Formik context. */
export function FieldView(props: LabelWrapperParams) {
  return <FieldWrapper {...props} />;
}

export interface ReadOnlyValueProps {
  value: any;
  link?: string;
  arrayItemLink?: string;
}

export function ReadOnlyValue({
  value,
  link,
  arrayItemLink
}: ReadOnlyValueProps) {
  return (
    <div
      className="field-view"
      style={{ minHeight: "25px", whiteSpace: "pre-wrap" }}
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
            displayString + ", "
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
    </div>
  );
}
