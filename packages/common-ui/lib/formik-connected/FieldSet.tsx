import classNames from "classnames";
import { useBulkEditTabFieldIndicators } from "..";
import { DinaFormSection, DinaFormSectionProps } from "./DinaForm";

export interface FieldSetProps extends DinaFormSectionProps {
  /** fieldset title. */
  legend: JSX.Element;

  className?: string;

  id?: string;

  /** The fieldName if  this fieldset corresponds to a DinaForm field. */
  fieldName?: string;
}

/** Wrapper around HTML fieldset element with Bootstrap styling. */
export function FieldSet({
  legend,
  className,
  id,
  fieldName,
  ...formSectionProps
}: FieldSetProps) {
  // Show the green fieldset legend/title when the field is bulk edited:
  const { bulkEditClasses } =
    useBulkEditTabFieldIndicators({ fieldName: fieldName ?? "notAField" }) ??
    {};

  return (
    <fieldset
      className={classNames(
        "mb-3 border card px-4 py-2",
        bulkEditClasses,
        className
      )}
      id={id}
    >
      <legend className={classNames("w-auto", fieldName && "field-label")}>
        <h2 className="fieldset-h2-adjustment">{legend}</h2>
      </legend>
      <DinaFormSection {...formSectionProps} />
    </fieldset>
  );
}
