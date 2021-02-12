import {
  Form,
  Formik,
  FormikConfig,
  FormikContextType,
  FormikProps,
  FormikValues
} from "formik";
import { BaseSyntheticEvent, KeyboardEvent, PropsWithChildren } from "react";
import { AccountContextI, useAccount } from "../account/AccountProvider";
import { ApiClientI, useApiClient } from "../api-client/ApiClientContext";
import { ErrorViewer } from "./ErrorViewer";
import { safeSubmit } from "./safeSubmit";

export interface DinaFormProps<TValues>
  extends Omit<FormikConfig<TValues>, "onSubmit"> {
  onSubmit?: DinaFormOnSubmit<TValues>;
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

  const { children: childrenProp, onSubmit: onSubmitProp } = props;

  /** Wrapped onSubmit prop with erorr handling and API/Account params. */
  const onSubmitInternal = safeSubmit(async (submittedValues, formik) => {
    await onSubmitProp?.({ submittedValues, formik, api, account });
  });

  const childrenInternal:
    | ((formikProps: FormikProps<Values>) => React.ReactNode)
    | React.ReactNode =
    typeof childrenProp === "function" ? (
      formikProps => <FormWrapper>{childrenProp(formikProps)}</FormWrapper>
    ) : (
      <FormWrapper>{childrenProp}</FormWrapper>
    );

  return (
    <Formik {...props} onSubmit={onSubmitInternal}>
      {childrenInternal}
    </Formik>
  );
}

function disableEnterKeyFormSubmit(
  event: KeyboardEvent<HTMLFormElement> & BaseSyntheticEvent
) {
  if (event.target.tagName !== "TEXTAREA" && event.which === 13 /* Enter */) {
    event.preventDefault();
  }
}

/** Wraps the inner content with the Form + ErrorViewer components. */
function FormWrapper({ children }: PropsWithChildren<{}>) {
  return (
    <Form onKeyDown={disableEnterKeyFormSubmit}>
      <ErrorViewer />
      {children}
    </Form>
  );
}
