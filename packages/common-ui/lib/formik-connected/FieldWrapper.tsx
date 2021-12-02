import classNames from "classnames";
import { FastField, FormikProps } from "formik";
import { isArray } from "lodash";
import { ReactNode, useMemo } from "react";
import { ErrorBoundary } from "react-error-boundary";
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
  readOnlyRender?: (value: any, form: FormikProps<any>) => ReactNode;

  removeBottomMargin?: boolean;

  /** Remove the label. */
  removeLabel?: boolean;

  /** Disables how clicking a label clicks the inner element. */
  disableLabelClick?: boolean;

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

  /** Override FastField's default shouldComponentUpdate */
  shouldUpdate?: (nextProps: LabelWrapperParams, props: {}) => boolean;

  validate?: (value: any) => string | void;
}

export interface FieldWrapperProps extends LabelWrapperParams {
  children?:
    | JSX.Element
    | ((renderProps: FieldWrapperRenderProps) => JSX.Element);
  removeLabelTag?: boolean;
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
  disableLabelClick,
  hideLabel = false,
  name,
  label,
  children,
  customName,
  link,
  readOnlyRender,
  removeBottomMargin,
  removeLabel,
  tooltipImage,
  tooltipImageAlt,
  tooltipLink,
  tooltipLinkText,
  templateCheckboxFieldName,
  removeLabelTag,
  shouldUpdate,
  validate
}: FieldWrapperProps) {
  const { horizontal, readOnly, isTemplate, enabledFields } =
    useDinaFormContext();

  /** Whether this field should be hidden because the template doesn't specify that it should be shown. */
  const disabledByFormTemplate = useMemo(
    () =>
      enabledFields
        ? !enabledFields.includes(templateCheckboxFieldName || name)
        : false,
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

  const [labelClass, valueClass] =
    horizontal === true
      ? ["col-sm-6", "col-sm-6"]
      : horizontal === "flex"
      ? ["", "flex-grow-1"]
      : (horizontal || []).map(col => `col-sm-${col}`) ||
        (isTemplate ? ["col-sm-12", "col-sm-12"] : []);

  if (disabledByFormTemplate) {
    return null;
  }

  const fieldWrapperInternal = (
    <div className={valueClass} style={{ cursor: "auto" }}>
      <FastField name={name} shouldUpdate={shouldUpdate} validate={validate}>
        {({ field: { value }, form, meta: { error } }) => (
          <ErrorBoundary
            // The error boundary is just for render errors
            // so an error thrown in a form field's render function kills just that field,
            // not the whole page.
            FallbackComponent={({ error: renderError }) => (
              <div className="alert alert-danger" role="alert">
                <pre className="mb-0">{renderError.message}</pre>
              </div>
            )}
          >
            {readOnly || !children
              ? readOnlyRender?.(value, form) ?? (
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
          </ErrorBoundary>
        )}
      </FastField>
    </div>
  );

  return (
    <div className={classNames(className, { row: isTemplate })}>
      {isTemplate && (
        <CheckBoxWithoutWrapper
          name={`templateCheckboxes['${templateCheckboxFieldName ?? name}']`}
          className="col-sm-1 templateCheckBox"
        />
      )}
      {removeLabelTag ? (
        <>
          {!removeLabel && (
            <div className={classNames(labelClass, !horizontal && "mb-2")}>
              {!hideLabel && <strong>{fieldLabel}</strong>}
            </div>
          )}

          {fieldWrapperInternal}
        </>
      ) : (
        <label
          className={classNames(
            `${name}-field`,
            customName && `${customName}-field`,
            horizontal === "flex" && "d-flex gap-2",
            horizontal ? "align-items-center" : "mb-2",
            (horizontal === true || isArray(horizontal)) && "row",
            isTemplate && `col-sm-${horizontal ? "11" : "10"}`,
            !isTemplate && !horizontal && "w-100",
            !removeBottomMargin && "mb-3"
          )}
          htmlFor={disableLabelClick ? "none" : undefined}
        >
          {!removeLabel && (
            <div className={classNames(labelClass, !horizontal && "mb-2")}>
              {!hideLabel && <strong>{fieldLabel}</strong>}
            </div>
          )}
          {fieldWrapperInternal}
        </label>
      )}
    </div>
  );
}
