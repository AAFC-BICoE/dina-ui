import classNames from "classnames";
import { useContext } from "react";
import { DinaFormContext, FieldSpy } from "..";
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
  const isInForm = !!useContext(DinaFormContext);

  const fieldSetProps = {
    className: classNames("mb-3 border card px-4 py-2", className),
    id,
    children: (
      <>
        <legend className={classNames("w-auto", fieldName && "field-label")}>
          <h2 className="fieldset-h2-adjustment">{legend}</h2>
        </legend>
        <DinaFormSection {...formSectionProps} />
      </>
    )
  };

  return isInForm ? (
    // Show the green fieldset legend/title when the field is bulk edited:
    <FieldSpy fieldName={fieldName ?? "notAField"}>
      {(_value, { bulkContext }) => (
        <fieldset
          {...fieldSetProps}
          className={classNames(
            fieldSetProps.className,
            bulkContext?.bulkEditClasses
          )}
        />
      )}
    </FieldSpy>
  ) : (
    <fieldset {...fieldSetProps} />
  );
}
