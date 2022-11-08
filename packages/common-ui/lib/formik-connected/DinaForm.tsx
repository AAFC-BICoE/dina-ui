import {
  Form,
  Formik,
  FormikConfig,
  FormikConsumer,
  FormikContextType,
  FormikProps,
  FormikValues
} from "formik";
import { cloneDeep } from "lodash";
import { FormTemplate } from "../../../dina-ui/types/collection-api";
import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useMemo
} from "react";
import { useIntl } from "react-intl";
import { BulkEditTabContext, scrollToError } from "..";
import { AccountContextI, useAccount } from "../account/AccountProvider";
import { ApiClientI, useApiClient } from "../api-client/ApiClientContext";
import { ErrorViewer } from "./ErrorViewer";
import { safeSubmit } from "./safeSubmit";

export interface DinaFormProps<TValues>
  extends Omit<FormikConfig<TValues>, "onSubmit">,
    Omit<DinaFormContextI, "initialValues"> {
  onSubmit?: DinaFormOnSubmit<TValues>;
}

/** Values available to form elements. */
export interface DinaFormContextI {
  readOnly?: boolean;
  /*
   * Whether to layout the label and value horizontally (Default vertical).
   * If a [number, number] is passed then those are the bootstrap grid columns for the label and value.
   * "true" defaults to [6, 6].
   */
  horizontal?: boolean | [number, number] | "flex";

  /** The initial form values passed into Formik. */
  initialValues?: any;

  /** Add a checkbox beside the wrapper field if true */
  isTemplate?: boolean;

  /**
   * Form template with all restrictions to place on the form.
   */
  formTemplate?: FormTemplate;

  /**
   * The component name for all of the fields within this dina form. Using DinaFormContext you can
   * override it.
   */
  componentName?: string;

  /**
   * The section name for all of the fields within this dina form. Using the DinaFormContext you can
   * override it.
   */
  sectionName?: string;

  /**
   * @deperecated
   * Whether this DinaForm is nested in another DinaForm. Nested forms are bad so avoid this.
   */
  isNestedForm?: boolean;
}

export type DinaFormOnSubmit<TValues = any> = (
  params: DinaFormSubmitParams<TValues>
) => Promise<void> | void;

export interface DinaFormSubmitParams<TValues> {
  submittedValues: TValues;
  formik: FormikContextType<TValues>;
  api: ApiClientI;
  account: AccountContextI;
}

/** Wrapps Formik with safe error handling+displaying and API/Account onSubmit params. */
export function DinaForm<Values extends FormikValues = FormikValues>(
  props: DinaFormProps<Values>
) {
  const api = useApiClient();
  const account = useAccount();

  const isNestedForm = !!useContext(DinaFormContext);

  const { children: childrenProp, onSubmit: onSubmitProp, readOnly } = props;

  /** Wrapped onSubmit prop with erorr handling and API/Account params. */
  const onSubmitInternal = safeSubmit(async (submittedValues, formik) => {
    // Make a copy of the submitted values so the original can't be mutated in the passed onSubmit function:
    const submittedValuesCopy = cloneDeep(submittedValues);
    try {
      await onSubmitProp?.({
        submittedValues: submittedValuesCopy,
        formik,
        api,
        account
      });
    } catch (error) {
      scrollToError();
      throw error;
    }
  });

  const childrenInternal:
    | ((formikProps: FormikProps<Values>) => React.ReactNode)
    | React.ReactNode =
    typeof childrenProp === "function" ? (
      (formikProps) => <FormWrapper>{childrenProp(formikProps)}</FormWrapper>
    ) : (
      <FormWrapper>{childrenProp}</FormWrapper>
    );

  // Clone the initialValues object so it isn't modified in the form:
  const initialValues = useMemo(
    () => cloneDeep(props.initialValues),
    [props.initialValues]
  );

  /**
   * Disable the bulk edit tab context for nested forms.
   * e.g. Don't show the has-bulk-edit-value indicators in the Material Sample
   * form's nested Collecting Event form.
   */
  const withBulkEditCtx = useCallback<(content: JSX.Element) => JSX.Element>(
    isNestedForm
      ? (content) => (
          <BulkEditTabContext.Provider value={null}>
            {content}
          </BulkEditTabContext.Provider>
        )
      : (content) => content,
    [isNestedForm]
  );

  return withBulkEditCtx(
    <DinaFormContext.Provider
      value={{
        ...props,
        isNestedForm,
        readOnly: props.readOnly ?? false
      }}
    >
      <Formik
        // Don't use Formik's default validation triggers:
        // Only validate on submit. And remove field error on field value change.
        validateOnChange={false}
        validateOnBlur={false}
        {...props}
        initialValues={initialValues}
        onSubmit={onSubmitInternal}
      >
        {childrenInternal}
      </Formik>
    </DinaFormContext.Provider>
  );
}

/** Wraps the inner content with the Form + ErrorViewer components. */
function FormWrapper({ children }: PropsWithChildren<{}>) {
  const { isNestedForm } = useDinaFormContext();

  // Disable enter to submit form in nested forms.
  function disableEnterToSubmitOuterForm(e) {
    // Pressing enter should not submit the outer form:
    if (e.keyCode === 13 && e.target.tagName !== "TEXTAREA") {
      e.preventDefault();
    }
  }

  const PromptIfDirty = ({ formik }) => {
    const { formatMessage } = useIntl();
    // only prompt if there is data change in edit or add pages
    if (formik.dirty && formik.values.type && formik.submitCount === 0) {
      window.onbeforeunload = () => {
        return formatMessage({ id: "possibleDataLossWarning" });
      };
    } else window.onbeforeunload = null;
    return null;
  };
  const Wrapper = isNestedForm ? "div" : Form;

  return (
    <Wrapper
      onKeyDown={isNestedForm ? disableEnterToSubmitOuterForm : undefined}
    >
      <ErrorViewer />
      <FormikConsumer>
        {(formik) => (
          <>
            <PromptIfDirty formik={formik} />
          </>
        )}
      </FormikConsumer>
      {children}
    </Wrapper>
  );
}

export const DinaFormContext = createContext<DinaFormContextI | null>(null);

export function useDinaFormContext() {
  const ctx = useContext(DinaFormContext);
  if (!ctx) {
    throw new Error("No DinaFormContext available.");
  }
  return ctx;
}

export type DinaFormSectionProps = PropsWithChildren<Partial<DinaFormContextI>>;

/**
 * Override context values for a section of the form.
 * e.g. making part of the form layout horizontal or readOnly.
 */
export function DinaFormSection({
  children,
  ...ctxOverride
}: DinaFormSectionProps) {
  const ctx = useContext(DinaFormContext);

  return (
    <DinaFormContext.Provider value={{ ...ctx, ...ctxOverride }}>
      {children}
    </DinaFormContext.Provider>
  );
}
