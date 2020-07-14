import { FormikContextType } from "formik";

export type OnFormikSubmit = (
  submittedValues: any,
  formik: FormikContextType<any>
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
      formik.setStatus(error.message);
    }
    formik.setSubmitting(false);
  };
}
