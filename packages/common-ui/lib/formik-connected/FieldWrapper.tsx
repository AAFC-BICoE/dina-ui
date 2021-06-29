import classNames from "classnames";
import { FastField, FormikProps } from "formik";
import { ReactNode, useMemo } from "react";
import { FieldHeader } from "../field-header/FieldHeader";
import { CheckBoxWithoutWrapper } from "./CheckBoxWithoutWrapper";
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
  label?: ReactNode;

  /** Override the default "name" prop used to get labels and tooltips from the intl messages. */
  customName?: string;

  /** Link href to render for a single string value. */
  link?: string;

  /** Custom element to render when the form is in read-only mode. */
  readOnlyRender?: (value: any) => ReactNode;

  removeFormGroupClass?: boolean;

  /** Remove the label. */
  removeLabel?: boolean;

  /** Add an image inside of the tooltip. Provide the URL of the image to display it. */
  tooltipImage?: string;

  /** Accessability text, only used if a tooltip image is provided. */
  tooltipImageAlt?: string;

  /** Add a link to a tooltip. */
  tooltipLink?: string;

  /** The text that appears for the link. */
  tooltipLinkText?: string;

  /**
   * Custom field name for the template checkbox.
   * e.g. passing "srcAdminLevels[0]" will change the default
   * "templateCheckboxes['srcAdminLevels[0].name']"
   * to "templateCheckboxes['srcAdminLevels[0]']".
   */
  templateCheckboxFieldName?: string;
}

export interface FieldWrapperProps extends LabelWrapperParams {
  children?:
    | JSX.Element
    | ((renderProps: FieldWrapperRenderProps) => JSX.Element);
}

export interface FieldWrapperRenderProps {
  invalid: boolean;
  value: any;
  setValue: (newValue: any) => void;
  formik: FormikProps<any>;
}

/**
 * Wraps a field with a label of the field's name and Formik's FastField. The label can be auto-generated as a title-case
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
  link,
  readOnlyRender,
  removeFormGroupClass,
  removeLabel,
  tooltipImage,
  tooltipImageAlt,
  tooltipLink,
  tooltipLinkText,
  templateCheckboxFieldName
}: FieldWrapperProps) {
  const { horizontal, readOnly, isTemplate, enabledFields } =
    useDinaFormContext();

  const disabledByFormTemplate = useMemo(
    () => (enabledFields ? !enabledFields.includes(name) : false),
    [enabledFields]
  );

  const fieldLabel = label ?? (
    <FieldHeader
      name={name}
      customName={customName}
      tooltipImage={tooltipImage}
      tooltipImageAlt={tooltipImageAlt}
      tooltipLink={tooltipLink}
      tooltipLinkText={tooltipLinkText}
    />
  );

  const [labelCol, valueCol] = isTemplate
    ? typeof horizontal === "boolean"
      ? [6, 6]
      : horizontal || [12, 12]
    : typeof horizontal === "boolean"
    ? [6, 6]
    : horizontal || [];

  if (disabledByFormTemplate) {
    return null;
  }

  return (
    <div className={classNames(className, { row: isTemplate })}>
      {isTemplate && (
        <CheckBoxWithoutWrapper
          name={`templateCheckboxes['${templateCheckboxFieldName ?? name}']`}
          className="col-sm-1 templateCheckBox"
        />
      )}
      <label
        className={`${name}-field ${
          isTemplate
            ? horizontal
              ? "row col-sm-11"
              : "col-sm-10"
            : horizontal
            ? "row"
            : "w-100"
        } ${removeFormGroupClass ? "" : "mb-3"}`}
      >
        {!removeLabel && (
          <div
            className={[
              `${labelCol ? `col-sm-${labelCol}` : ""}`,
              // Adjust alignment for editable inputs:
              horizontal && !readOnly && !isTemplate ? "mt-sm-2" : "",
              "mb-2"
            ].join(" ")}
          >
            {!hideLabel && <strong>{fieldLabel}</strong>}
          </div>
        )}
        <div className={valueCol ? `col-sm-${valueCol}` : ""}>
          <FastField name={name}>
            {({ field: { value }, form, meta: { error } }) => (
              <>
                {readOnly || !children
                  ? readOnlyRender?.(value) ?? (
                      <ReadOnlyValue link={link} value={value} />
                    )
                  : typeof children === "function"
                  ? children?.({
                      invalid: Boolean(error),
                      value,
                      setValue: newValue => {
                        // Remove the error message when the user edits the field:
                        form.setFieldError(name, undefined);
                        form.setFieldValue(name, newValue);
                        form.setFieldTouched(name);
                      },
                      formik: form
                    })
                  : children}
                {error && <div className="invalid-feedback">{error}</div>}
              </>
            )}
          </FastField>
        </div>
      </label>
    </div>
  );
}
