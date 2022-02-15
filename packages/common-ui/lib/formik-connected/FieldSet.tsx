import classNames from "classnames";
import { CSSProperties } from "react";
import { useContext } from "react";
import { DinaFormContext, FieldSpy, FieldSpyRenderProps } from "..";
import { DinaFormSection, DinaFormSectionProps } from "./DinaForm";

export interface FieldSetProps extends DinaFormSectionProps {
  /** fieldset title. */
  legend: JSX.Element;

  className?: string;
  style?: CSSProperties;

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
  style,
  ...formSectionProps
}: FieldSetProps) {
  const isInForm = !!useContext(DinaFormContext);

  const fieldSetProps = (fieldSpyProps?: FieldSpyRenderProps) => ({
    className: classNames("mb-3 border card px-4 py-2", className),
    style,
    id,
    children: (
      <>
        <div
          className={classNames(
            "legend-wrapper",
            fieldSpyProps?.bulkContext?.bulkEditClasses,
            fieldSpyProps?.isChanged && "changed-field"
          )}
        >
          <legend className={classNames("w-auto", fieldName && "field-label")}>
            <h2 className="fieldset-h2-adjustment">{legend}</h2>
          </legend>
        </div>
        <DinaFormSection {...formSectionProps} />
      </>
    )
  });

  return isInForm ? (
    // Show the green fieldset legend/title when the field is bulk edited:
    <FieldSpy fieldName={fieldName ?? "notAField"}>
      {(_value, fieldSpyProps) => (
        <fieldset {...fieldSetProps(fieldSpyProps)} />
      )}
    </FieldSpy>
  ) : (
    <fieldset {...fieldSetProps()} />
  );
}
