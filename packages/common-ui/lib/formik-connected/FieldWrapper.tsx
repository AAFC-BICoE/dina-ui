import { FastField } from "formik";
import { ReactNode } from "react";
import { FieldHeader } from "../field-header/FieldHeader";
import { useDinaFormContext } from "./DinaForm";
import { ReadOnlyValue } from "./FieldView";

export interface LabelWrapperParams {
  /** The CSS classes of the div wrapper. */
  className?: string;

  /** Hides the label. */
  hideLabel?: boolean;

  /** The name of the field. */
  name: string;

  /** The label for the field. */
  label?: string;

  /** Override the default "name" prop used to get labels and tooltips from the intl messages. */
  customName?: string;

  /** Link href to render for a single string value. */
  link?: string;

  /** Link href to render on each array item. */
  arrayItemLink?: string;

  /** Custom element to render when the form is in read-only mode. */
  readOnlyRender?: (value: any) => ReactNode;
}

export interface FieldWrapperProps extends LabelWrapperParams {
  children?: JSX.Element;
}

/**
 * Wraps a field with a label of the field's name. The label can be auto-generated as a title-case
 * version of the field name, or can be specified as a custom label string.
 *
 * This component also wraps the field in a div with the className `${fieldName}-field` for testing purposes.
 * e.g. select the "description" text input using wrapper.find(".description-field input").
 */
export function FieldWrapper({
  className,
  hideLabel = false,
  name,
  label,
  children,
  customName,
  arrayItemLink,
  link,
  readOnlyRender
}: FieldWrapperProps) {
  const { readOnly } = useDinaFormContext();

  const fieldLabel = label ?? (
    <FieldHeader name={name} customName={customName} />
  );

  return (
    <div className={className}>
      <div className={`form-group ${name}-field`}>
        <label className="w-100">
          {!hideLabel && (
            <div>
              <strong>{fieldLabel}</strong>
            </div>
          )}
          {readOnly || !children ? (
            <FastField name={name}>
              {({ field: { value } }) =>
                readOnlyRender?.(value) ?? (
                  <ReadOnlyValue
                    arrayItemLink={arrayItemLink}
                    link={link}
                    value={value}
                  />
                )
              }
            </FastField>
          ) : (
            children
          )}
        </label>
      </div>
    </div>
  );
}
