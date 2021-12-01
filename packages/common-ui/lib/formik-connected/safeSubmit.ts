import { FormikContextType } from "formik";
import { DoOperationsError } from "../api-client/ApiClientContext";

export type OnFormikSubmit<TValues = any> = (
  submittedValues: TValues,
  formik: FormikContextType<TValues>
) => void | Promise<void>;

/**
 * Wraps a formik form submit callback with generic error handling.
 */
export function safeSubmit(submitfn: OnFormikSubmit): OnFormikSubmit {
  return async (submittedValues: any, formik: FormikContextType<any>) => {
    formik.setStatus(null);
    formik.setSubmitting(true);
    try {
      await submitfn(submittedValues, formik);
    } catch (error) {
      console.error(error);
      if (error instanceof Error) {
        formik.setStatus(error.message);
      }
      if (error instanceof DoOperationsError) {
        formik.setErrors(error.fieldErrors);
      }
    }
    formik.setSubmitting(false);
  };
}
