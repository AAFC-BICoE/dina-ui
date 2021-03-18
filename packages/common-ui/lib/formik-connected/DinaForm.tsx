import {
  Form,
  Formik,
  FormikConfig,
  FormikContextType,
  FormikProps,
  FormikValues
} from "formik";
import { cloneDeep } from "lodash";
import { PropsWithChildren } from "react";
import { AccountContextI, useAccount } from "../account/AccountProvider";
import { ApiClientI, useApiClient } from "../api-client/ApiClientContext";
import { ErrorViewer } from "./ErrorViewer";
import { safeSubmit } from "./safeSubmit";

export interface DinaFormProps<TValues>
  extends Omit<FormikConfig<TValues>, "onSubmit"> {
  onSubmit?: DinaFormOnSubmit<TValues>;
  values?: TValues;
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
    // Make a copy of the submitted values so the original can't be mutated in the passed onSubmit function:
    const submittedValuesCopy = cloneDeep(submittedValues);
    await onSubmitProp?.({
      submittedValues: submittedValuesCopy,
      formik,
      api,
      account
    });
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

/** Wraps the inner content with the Form + ErrorViewer components. */
function FormWrapper({ children }: PropsWithChildren<{}>) {
  return (
    <Form>
      <ErrorViewer />
      {children}
    </Form>
  );
}
