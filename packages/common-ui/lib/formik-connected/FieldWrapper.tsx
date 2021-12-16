import classNames from "classnames";
import { FastField, FastFieldProps, FormikProps } from "formik";
import { isArray } from "lodash";
import { PropsWithChildren, ReactNode, useMemo } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useBulkEditTabFieldIndicators } from "../bulk-edit/useBulkEditTabField";
import { FieldHeader } from "../field-header/FieldHeader";
import { CheckBoxWithoutWrapper } from "./CheckBoxWithoutWrapper";
import { useDinaFormContext } from "./DinaForm";
import { ReadOnlyValue } from "./FieldView";

export interface FieldWrapperProps {
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

  removeLabelTag?: boolean;

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
  shouldUpdate?: (nextProps: FieldWrapperProps, props: {}) => boolean;

  validate?: (value: any) => string | void;
  children?:
    | JSX.Element
    | ((renderProps: FieldWrapperRenderProps) => JSX.Element);
}

export interface FieldWrapperRenderProps {
  invalid: boolean;
  value: any;
  setValue: (newValue: any) => void;
  placeholder?: string;
  defaultValue?: any;
  formik: FormikProps<any>;
}

/**
 * Wraps a field with a label of the field's name and Formik's FastField. The label can be auto-generated as a title-case
 * version of the field name, or can be specified as a custom label string.
 *
 * This component also wraps the field in a div with the className `${fieldName}-field` for testing purposes.
 * e.g. select the "description" text input using wrapper.find(".description-field input").
 */
export function FieldWrapper(props: FieldWrapperProps) {
  const { name, templateCheckboxFieldName, shouldUpdate, validate } = props;

  const { enabledFields } = useDinaFormContext();

  /** Whether this field should be hidden because the template doesn't specify that it should be shown. */
  const disabledByFormTemplate = useMemo(
    () =>
      enabledFields
        ? !enabledFields.includes(templateCheckboxFieldName || name)
        : false,
    [enabledFields]
  );

  if (disabledByFormTemplate) {
    return null;
  }

  return (
    <FastField name={name} shouldUpdate={shouldUpdate} validate={validate}>
      {fastFieldProps => (
        <LabelWrapper fieldWrapperProps={props} fastFieldProps={fastFieldProps}>
          <FormikConnectedField
            fastFieldProps={fastFieldProps}
            fieldWrapperProps={props}
          />
        </LabelWrapper>
      )}
    </FastField>
  );
}

interface FieldWrapperInternalProps {
  fastFieldProps: FastFieldProps<any>;
  fieldWrapperProps: FieldWrapperProps;
}

/** Wraps a field with a label and flex layout */
function LabelWrapper({
  fieldWrapperProps: {
    className,
    customName,
    disableLabelClick,
    hideLabel = false,
    label,
    name,
    removeBottomMargin,
    removeLabel,
    removeLabelTag,
    tooltipImage,
    templateCheckboxFieldName,
    tooltipImageAlt,
    tooltipLink,
    tooltipLinkText
  },
  fastFieldProps: {
    field: { value }
  },
  children
}: PropsWithChildren<FieldWrapperInternalProps>) {
  const { horizontal, isTemplate } = useDinaFormContext();
  const bulkTab = useBulkEditTabFieldIndicators({
    fieldName: name,
    currentValue: value
  });

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

  return (
    <div
      className={classNames(
        className,
        isTemplate && "row",
        bulkTab?.bulkEditClasses
      )}
    >
      {isTemplate && (
        <CheckBoxWithoutWrapper
          name={`templateCheckboxes['${templateCheckboxFieldName ?? name}']`}
          className={`col-sm-1 templateCheckBox ${
            horizontal === "flex" && "mt-2"
          }`}
        />
      )}
      {removeLabelTag ? (
        <>
          {!removeLabel && (
            <div className={classNames(labelClass, !horizontal && "mb-2")}>
              {!hideLabel && <strong>{fieldLabel}</strong>}
            </div>
          )}

          <div className={valueClass} style={{ cursor: "auto" }}>
            {children}
          </div>
        </>
      ) : isTemplate && horizontal === "flex" ? (
        <div className={`col-sm-10`}>
          <label
            className={classNames(
              `${name}-field`,
              customName && `${customName}-field`,
              "d-flex gap-2 align-items-center"
            )}
            htmlFor={disableLabelClick ? "none" : undefined}
          >
            {!removeLabel && (
              <div className={classNames(labelClass, !horizontal && "mb-2")}>
                {!hideLabel && <strong>{fieldLabel}</strong>}
              </div>
            )}
            <div className={valueClass} style={{ cursor: "auto" }}>
              {children}
            </div>
          </label>
        </div>
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
          <div className={valueClass} style={{ cursor: "auto" }}>
            {children}
          </div>
        </label>
      )}
    </div>
  );
}

/** A user input connected to Formik state. */
function FormikConnectedField({
  fastFieldProps: {
    form,
    field: { name, value },
    meta: { error }
  },
  fieldWrapperProps: { readOnlyRender, link, children }
}: FieldWrapperInternalProps) {
  const { readOnly } = useDinaFormContext();
  const bulkTab = useBulkEditTabFieldIndicators({
    fieldName: name,
    currentValue: value
  });

  function setValue(newValue: any) {
    // Remove the error message when the user edits the field:
    form.setFieldError(name, undefined);
    form.setFieldValue(name, newValue);
    form.setFieldTouched(name);
  }

  const renderProps: FieldWrapperRenderProps = {
    invalid: Boolean(error),
    value,
    setValue,
    formik: form,

    // Only used within the bulk editor's "Edit All" tab:
    defaultValue: bulkTab?.defaultValue,
    placeholder: bulkTab?.placeholder
  };

  return (
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
        ? children?.(renderProps)
        : children}
      {error && <div className="invalid-feedback">{error}</div>}
    </ErrorBoundary>
  );
}
