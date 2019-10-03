import { FormikActions } from "formik";

type OnFormikSubmit = (
  submittedValues: any,
  formik: FormikActions<any>
) => void | Promise<void>;

/**
 * Wraps a formik form submit callback with generic error handling.
 */
export function safeSubmit(submitfn: OnFormikSubmit): OnFormikSubmit {
  return async (submittedValues: any, formik: FormikActions<any>) => {
    try {
      await submitfn(submittedValues, formik);
    } catch (error) {
      formik.setStatus(error.message);
    }
    formik.setSubmitting(false);
  };
}
