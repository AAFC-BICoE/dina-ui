import classNames from "classnames";
import { FormikProps } from "formik";
import { get, isArray } from "lodash";
import {
  FormTemplate,
  FormTemplateSectionItem
} from "../../../dina-ui/types/collection-api";
import { PropsWithChildren, ReactNode, useEffect, useMemo } from "react";
import { ErrorBoundary } from "react-error-boundary";
import {
  FieldSpyRenderProps,
  useBulkEditContext,
  useBulkEditTabContext
} from "..";
import { useBulkEditTabFieldIndicators } from "../bulk-edit/useBulkEditTabField";
import { FieldHeader } from "../field-header/FieldHeader";
import { getFormTemplateField } from "../form-template/formTemplateUtils";
import { CheckBoxWithoutWrapper } from "./CheckBoxWithoutWrapper";
import { useDinaFormContext } from "./DinaForm";
import { FieldSpy } from "./FieldSpy";
import { ReadOnlyValue } from "./FieldView";

export interface CustomHandleDefaultValueProps {
  /** The whole form template object. */
  formTemplate: FormTemplate | undefined;

  /** This is the current item received from the form template. */
  formTemplateItem: FormTemplateSectionItem | undefined;

  /** Once you ran your custom logic to get the default value, it can be set for the field here. */
  setDefaultValue: (value: any) => void;

  /**
   * The full formik context for changing parts all parts of the form.
   * Please note that if you are changing parts of the form you should disable the form template
   * default value since it's being handled here.
   *
   * The default values are also passed to the CustomHandleDefaultValue callback function.
   */
  formikContext: FormikProps<any>;

  /**
   * Default values provided from the DinaForm itself.
   */
  initialValues: any;
}

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

  validate?: (value: any) => string | void;

  /**
   * If custom processing needs to be done on the default fields value from the form template this
   * function can be used.
   *
   * This method will not be ran if the disableFormTemplateDefaultValue is enabled.
   */
  customHandleDefaultValue?: (props: CustomHandleDefaultValueProps) => void;

  disableFormTemplateDefaultValue?: boolean;

  children?:
    | JSX.Element
    | ((renderProps: FieldWrapperRenderProps) => JSX.Element);
}

export interface FieldWrapperRenderProps {
  invalid: boolean;
  value: any;
  setValue: (newValue: any) => void;
  placeholder?: string;

  /** A value to render when there is no value stored in form state. */
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
  const { name, templateCheckboxFieldName, validate } = props;

  const { formTemplate, componentName, sectionName } = useDinaFormContext();

  /** Whether this field should be hidden because the template doesn't specify that it should be shown. */
  const disabledByFormTemplate: boolean = useMemo(() => {
    const fieldProps = getFormTemplateField(
      formTemplate,
      componentName,
      sectionName,
      templateCheckboxFieldName ?? name
    );

    if (fieldProps) {
      return !fieldProps.visible;
    }

    return false;
  }, [formTemplate]);

  if (disabledByFormTemplate) {
    return null;
  }

  return (
    <FieldSpy fieldName={name} validate={validate}>
      {(_value, fieldSpyProps) => (
        <LabelWrapper fieldWrapperProps={props} fieldSpyProps={fieldSpyProps}>
          <FormikConnectedField
            fieldSpyProps={fieldSpyProps}
            fieldWrapperProps={props}
          />
        </LabelWrapper>
      )}
    </FieldSpy>
  );
}

interface FieldWrapperInternalProps {
  fieldSpyProps: FieldSpyRenderProps;
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
    tooltipImage,
    templateCheckboxFieldName,
    tooltipImageAlt,
    tooltipLink,
    tooltipLinkText
  },
  fieldSpyProps: {
    field: { value },
    isChanged
  },
  children
}: PropsWithChildren<FieldWrapperInternalProps>) {
  const { horizontal, isTemplate, componentName, sectionName } =
    useDinaFormContext();
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
      : (horizontal || []).map((col) => `col-sm-${col}`) ||
        (isTemplate ? ["col-sm-12", "col-sm-12"] : []);

  // Replace dots and square brackets with underscores so the classes are selectable in tests and CSS:
  // e.g. organism.lifeStage-field -> organism_lifeStage-field
  const fieldNameClasses = [name, customName].map(
    (it) => it && `${it.replaceAll(/[\.\[\]]/g, "_")}-field`
  );

  return (
    <div
      className={classNames(
        className,
        isTemplate && "row",
        bulkTab?.bulkEditClasses,
        isChanged && "changed-field"
      )}
    >
      {isTemplate && (
        <CheckBoxWithoutWrapper
          name={`templateCheckboxes['${componentName}.${sectionName}.${
            templateCheckboxFieldName ?? name
          }']`}
          className={`col-sm-1 templateCheckBox ${
            horizontal === "flex" && "mt-2"
          }`}
        />
      )}
      {isTemplate && horizontal === "flex" ? (
        <div className={`col-sm-10`}>
          <label
            className={classNames(
              ...fieldNameClasses,
              "d-flex gap-2 align-items-center"
            )}
            htmlFor={disableLabelClick ? "none" : undefined}
          >
            {!removeLabel && (
              <div
                className={classNames(
                  "field-label",
                  labelClass,
                  !horizontal && "mb-2"
                )}
              >
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
            ...fieldNameClasses,
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
            <div
              className={classNames(
                "field-label",
                labelClass,
                !horizontal && "mb-2"
              )}
            >
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
  fieldSpyProps: {
    form,
    field: { name, value: formikValue },
    meta: { error }
  },
  fieldWrapperProps: {
    readOnlyRender,
    link,
    children,
    customHandleDefaultValue,
    disableFormTemplateDefaultValue
  }
}: FieldWrapperInternalProps) {
  const {
    readOnly,
    formTemplate,
    componentName,
    sectionName,
    isExistingRecord,
    initialValues
  } = useDinaFormContext();

  const isBulkEditing = !!useBulkEditContext();
  const isOnBulkEditAllTab = !!useBulkEditTabContext();

  const bulkTab = useBulkEditTabFieldIndicators({
    fieldName: name,
    currentValue: formikValue
  });

  function setValue(input: any) {
    // Remove the error message when the user edits the field:
    form.setFieldError(name, undefined);
    form.setFieldTouched(name, true);

    // When the input equals the bulk edit default/common value, set to undefined instead:
    const newValue = input === bulkTab?.defaultValue ? undefined : input;

    form.setFieldValue(name, newValue);
  }

  // In the bulk edit tab, show the default value when the value is undefined:
  const value =
    bulkTab && formikValue === undefined ? bulkTab?.defaultValue : formikValue;

  const renderProps: FieldWrapperRenderProps = {
    invalid: Boolean(error),
    value,
    setValue,
    formik: form,

    // Only used within the bulk editor's "Edit All" tab:
    placeholder: bulkTab?.placeholder
  };

  /**
   * Default values will be retrieved from the form template here. Only load the default value if
   * the form template has just been loaded and the value is undefined.
   */
  useEffect(() => {
    // If the form template is null, it contains no form template support.
    if (formTemplate === null) return;

    // Check if default value retrieval is disabled for this field.
    if (disableFormTemplateDefaultValue) return;

    // If editing an existing record, do not apply default values.
    if (isExistingRecord) return;

    // If editing in a bulk edit context, only apply the default values to the edit all tab.
    if (isBulkEditing && !isOnBulkEditAllTab) return;

    // Apply initial values default value if possible.
    if (formTemplate === undefined) {
      setValue(get(initialValues, name, undefined));
    }

    const fieldProps = getFormTemplateField(
      formTemplate,
      componentName,
      sectionName,
      name
    );

    // Check if a default value exists to be applied. In bulk edit mode, it should only be applied
    // in the edit mode part.
    if (fieldProps) {
      // Check if custom logic for setting the default value is supplied.
      if (customHandleDefaultValue) {
        customHandleDefaultValue({
          formTemplate,
          formTemplateItem: fieldProps,
          formikContext: form,
          setDefaultValue: setValue,
          initialValues
        });
      } else {
        setValue(fieldProps.defaultValue);
      }
    }
  }, [formTemplate]);

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
