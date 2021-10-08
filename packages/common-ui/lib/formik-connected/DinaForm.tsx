import {
  Form,
  Formik,
  FormikConfig,
  FormikContextType,
  FormikProps,
  FormikValues
} from "formik";
import { cloneDeep } from "lodash";
import {
  createContext,
  Fragment,
  PropsWithChildren,
  useContext,
  useMemo
} from "react";
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

  /** Optionally restrict the writable fields to this list. */
  enabledFields?: string[] | null;

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

  const { children: childrenProp, onSubmit: onSubmitProp } = props;

  /** Wrapped onSubmit prop with erorr handling and API/Account params. */
  const onSubmitInternal = safeSubmit(async (submittedValues, formik) => {
    // Make a copy of the submitted values so the original can't be mutated in the passed onSubmit function:
    const submittedValuesCopy = cloneDeep(submittedValues);
    await onSubmitProp?.({
      submittedValues: submittedValuesCopy,
      formik,
      api,
      account
    });
  });

  const FormWrapperInternal = isNestedForm ? Fragment : FormWrapper;

  const childrenInternal:
    | ((formikProps: FormikProps<Values>) => React.ReactNode)
    | React.ReactNode =
    typeof childrenProp === "function" ? (
      formikProps => (
        <FormWrapperInternal>{childrenProp(formikProps)}</FormWrapperInternal>
      )
    ) : (
      <FormWrapperInternal>{childrenProp}</FormWrapperInternal>
    );

  // Clone the initialValues object so it isn't modified in the form:
  const initialValues = useMemo(
    () => cloneDeep(props.initialValues),
    [props.initialValues]
  );

  return (
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
  return (
    <Form>
      <ErrorViewer />
      {children}
    </Form>
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
