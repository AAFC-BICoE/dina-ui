import {
  Form,
  Formik,
  FormikConfig,
  FormikConsumer,
  FormikContextType,
  FormikProps,
  FormikValues
} from "formik";
import _ from "lodash";
import { FormTemplate } from "@dina-ui/types/collection-api";
import {
  createContext,
  PropsWithChildren,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef
} from "react";
import {
  formatJsonApiErrorMessage,
  normalizeJsonApiPointer
} from "../util/jsonApiErrorNormalization";
import { useIntl } from "react-intl";
import { useRouter } from "next/router";
import { BulkEditTabContext, scrollToError } from "..";
import { AccountContextI, useAccount } from "../account/AccountProvider";
import { ApiClientI, useApiClient } from "../api-client/ApiClientContext";
import { ErrorViewer } from "./ErrorViewer";
import { safeSubmit } from "./safeSubmit";

export interface DinaFormProps<TValues>
  extends Omit<FormikConfig<TValues>, "onSubmit">,
    Omit<DinaFormContextI, "initialValues"> {
  onSubmit?: DinaFormOnSubmit<TValues>;
  customErrorViewerMessage?: (field: string, error: any) => string;
}

/** Values available to form elements. */
export interface DinaFormContextI {
  readOnly?: boolean;
  /*
   * Whether to layout the label and value horizontally (Default vertical).
   * If a [number, number] is passed then those are the bootstrap grid columns for the label and value.
   * "true" defaults to [6, 6].
   */
  horizontal?: boolean | [number, number] | "flex" | number;

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

  isBulkEditAllTab?: boolean;

  /**
   * Some parts of the Edit All tab support an enhanced deleted experience which makes it more
   * clear what the user is doing. By default this is enabled for everything. This is to override
   * and disable this feature so the normal delete is performed.
   */
  disableEditAllDelete?: boolean;
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

/** A DinaForm's Formik bag, plus the helpers DinaForm adds onto it. */
export interface DinaFormikBag<TValues = any>
  extends FormikContextType<TValues> {
  /**
   * Records that these values are now saved, so the unsaved-data warning stops
   * counting this form. Needed by forms that are submitted programmatically
   * through a ref instead of their own <form> submit event.
   */
  markFormSaved?: (savedValues: TValues) => void;
}

function parseJsonApiErrors(error: any): Record<string, string> {
  const errors = error?.cause?.data?.errors ?? error?.response?.data?.errors;
  const fieldErrors: Record<string, string> = {};

  if (Array.isArray(errors)) {
    for (const err of errors) {
      const pointer = err?.source?.pointer;
      const fieldName = pointer ? normalizeJsonApiPointer(pointer) : "";
      if (fieldName) {
        fieldErrors[fieldName] = formatJsonApiErrorMessage(
          err.title,
          err.detail
        );
      } else {
        // If no field is specified, assign general submission error
        fieldErrors["Form submission issue"] = formatJsonApiErrorMessage(
          err.title,
          err.detail
        );
      }
    }
  }

  return fieldErrors;
}

/** Wrapps Formik with safe error handling+displaying and API/Account onSubmit params. */
export function DinaForm<Values extends FormikValues = FormikValues>(
  props: DinaFormProps<Values>
) {
  const api = useApiClient();
  const account = useAccount();

  const isNestedForm = !!useContext(DinaFormContext);

  const {
    children: childrenProp,
    onSubmit: onSubmitProp,
    customErrorViewerMessage
  } = props;

  /** Wrapped onSubmit prop with erorr handling and API/Account params. */
  const onSubmitInternal = safeSubmit(async (submittedValues, formik) => {
    // Make a copy of the submitted values so the original can't be mutated in the passed onSubmit function:
    const submittedValuesCopy = _.cloneDeep(submittedValues);
    try {
      await onSubmitProp?.({
        submittedValues: submittedValuesCopy,
        formik,
        api,
        account
      });
    } catch (error: any) {
      scrollToError();

      // Attempt to extract JSON:API-style errors
      const errors =
        error?.cause?.data?.errors ?? error?.response?.data?.errors;
      if (Array.isArray(errors)) {
        const fieldErrors = parseJsonApiErrors(error);
        formik.setErrors(fieldErrors);
        return;
      }

      // Fallback: show general error
      throw error;
    }
  });

  const childrenInternal:
    | ((formikProps: FormikProps<Values>) => React.ReactNode)
    | React.ReactNode =
    typeof childrenProp === "function" ? (
      (formikProps) => (
        <FormWrapper customErrorViewerMessage={customErrorViewerMessage}>
          {childrenProp(formikProps)}
        </FormWrapper>
      )
    ) : (
      <FormWrapper customErrorViewerMessage={customErrorViewerMessage}>
        {childrenProp}
      </FormWrapper>
    );

  // Clone the initialValues object so it isn't modified in the form:
  const initialValues = useMemo(
    () => _.cloneDeep(props.initialValues),
    [props.initialValues]
  );

  /**
   * Disable the bulk edit tab context for nested forms.
   * e.g. Don't show the has-bulk-edit-value indicators in the Material Sample
   * form's nested Collecting Event form.
   */
  const withBulkEditCtx = useCallback<
    (content: React.JSX.Element) => React.JSX.Element
  >(
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
      <Formik<Values>
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

interface FormWrapperProps {
  children: ReactNode;
  customErrorViewerMessage?: (field: string, error: any) => string;
}

// Singleton unsaved-data warning

/** IDs of the forms that currently have unsaved data. A Set (rather than a
 *  plain counter) lets one specific form be cleared precisely -- see
 *  `markFormSaved` below. */
const dirtyFormIds = new Set<symbol>();
let listenersRegistered = false;
let suppressNextNav = false;

/** Call before a programmatic navigation (save → result page, session timeout
 *  redirect) to suppress the unsaved-data warning for the next navigation
 *  only.  The flag auto-resets after one use. */
export function suppressUnsavedWarning() {
  suppressNextNav = true;
}

/** @internal Exported for tests. Resets the singleton warning state */
export function __resetUnsavedWarningState() {
  dirtyFormIds.clear();
  listenersRegistered = false;
  suppressNextNav = false;
}

function addDirtyForm(
  id: symbol,
  router: any,
  formatMessage: (descriptor: { id: string }) => string
) {
  dirtyFormIds.add(id);
  warningMessage = formatMessage({ id: "possibleDataLossWarning" });
  routerRef = router;
  registerListeners(router);
}

function removeDirtyForm(id: symbol) {
  dirtyFormIds.delete(id);
  if (dirtyFormIds.size === 0) {
    unregisterListeners(routerRef);
  }
}

/** Strips out values that represent "nothing entered": blank strings, nulls,
 *  and objects/arrays that are empty once their own blanks are removed. Some
 *  sections seed a blank row into form state purely so there's an empty input
 *  to type into, which would otherwise make an untouched form look like it has
 *  unsaved data.
 *
 *  `ancestors` guards against the cycles that linked resources can form (e.g.
 *  a parent pointing back at its children). */
function withoutBlankValues(value: any, ancestors = new WeakSet<any>()): any {
  if (value === "" || value === null) {
    return undefined;
  }
  if (typeof value !== "object" || ancestors.has(value)) {
    return value;
  }

  const isArray = Array.isArray(value);
  if (!isArray && !_.isPlainObject(value)) {
    return value;
  }

  ancestors.add(value);

  let stripped: any;
  if (isArray) {
    const items = value
      .map((item) => withoutBlankValues(item, ancestors))
      .filter((item) => item !== undefined);
    stripped = items.length ? items : undefined;
  } else {
    const object = _.omitBy(
      _.mapValues(value, (item) => withoutBlankValues(item, ancestors)),
      _.isUndefined
    );
    stripped = _.isEmpty(object) ? undefined : object;
  }

  ancestors.delete(value);
  return stripped;
}

const sharedBeforeUnload = (e: BeforeUnloadEvent) => {
  if (suppressNextNav) {
    suppressNextNav = false;
    return;
  }
  e.preventDefault();
};

function registerListeners(router: any) {
  if (listenersRegistered) return;
  listenersRegistered = true;
  window.addEventListener("beforeunload", sharedBeforeUnload);
  if (router?.events) {
    router.events.on("routeChangeStart", sharedRouteChange);
  }
}

function unregisterListeners(router: any) {
  if (!listenersRegistered) return;
  listenersRegistered = false;
  window.removeEventListener("beforeunload", sharedBeforeUnload);
  if (router?.events) {
    router.events.off("routeChangeStart", sharedRouteChange);
  }
}

function sharedRouteChange() {
  if (suppressNextNav) {
    suppressNextNav = false;
    return;
  }
  if (dirtyFormIds.size > 0 && !window.confirm(warningMessage)) {
    routerRef?.events?.emit("routeChangeError");
    throw "routeChange aborted.";
  }
}

/** Latest warning message — kept up to date by PromptIfDirty. */
let warningMessage = "";
let routerRef: any = null;

/** Warns on browser close/refresh and internal SPA navigation if any form
 *  is dirty.  Uses module-level singleton listeners so multiple DinaForm
 *  instances never produce duplicate dialogs. */
function PromptIfDirty({
  formik,
  readOnly
}: {
  formik: any;
  readOnly?: boolean;
}) {
  const { formatMessage } = useIntl();
  const router = useRouter();

  const idRef = useRef<symbol | null>(null);
  if (!idRef.current) {
    idRef.current = Symbol("dina-form");
  }

  // A read-only or already-submitted form can't have unsaved data, so skip the
  // comparison work entirely for it.
  const skipTracking =
    !!readOnly || !formik.values.type || formik.submitCount !== 0;

  // The last saved state to compare the current values against, with blank
  // values already stripped. Starts at the form's initial values, and moves
  // forward whenever markFormSaved() is called.
  const savedValuesRef = useRef<{ value: any } | null>(null);
  if (!skipTracking && !savedValuesRef.current) {
    savedValuesRef.current = {
      value: withoutBlankValues(formik.initialValues)
    };
  }

  const currentValues = useMemo(
    () => (skipTracking ? undefined : withoutBlankValues(formik.values)),
    [formik.values, skipTracking]
  );

  const isDirty =
    !skipTracking && !_.isEqual(currentValues, savedValuesRef.current?.value);

  // markFormSaved takes effect immediately rather than on the next render,
  // since a save is usually followed by a redirect and Next.js fires
  // routeChangeStart synchronously inside router.push.
  useEffect(() => {
    formik.markFormSaved = (savedValues: any) => {
      savedValuesRef.current = { value: withoutBlankValues(savedValues) };
      removeDirtyForm(idRef.current!);
    };

    if (isDirty) {
      addDirtyForm(idRef.current!, router, formatMessage);
    } else {
      removeDirtyForm(idRef.current!);
    }
  });

  useEffect(() => () => removeDirtyForm(idRef.current!), []);

  return null;
}

/** Wraps the inner content with the Form + ErrorViewer components. */
function FormWrapper({ children, customErrorViewerMessage }: FormWrapperProps) {
  const { isNestedForm, readOnly } = useDinaFormContext();

  // Disable enter to submit form in nested forms.
  function disableEnterToSubmitOuterForm(e) {
    // Pressing enter should not submit the outer form:
    if (e.keyCode === 13 && e.target.tagName !== "TEXTAREA") {
      e.preventDefault();
    }
  }

  const Wrapper = isNestedForm ? "div" : Form;

  return (
    <Wrapper
      onKeyDown={isNestedForm ? disableEnterToSubmitOuterForm : undefined}
    >
      <ErrorViewer customErrorViewerMessage={customErrorViewerMessage} />
      <FormikConsumer>
        {(formik) => <PromptIfDirty formik={formik} readOnly={readOnly} />}
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
