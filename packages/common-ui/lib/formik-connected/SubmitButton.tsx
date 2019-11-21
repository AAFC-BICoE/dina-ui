import { connect } from "formik";
import { LoadingSpinner } from "..";

/**
 * Formik-connected submit button that shows a loading indicator instead when the form is submitting.
 */

/* tslint:disable:no-string-literal */

export const SubmitButton = connect(function SubmitButtonInternal({
  formik: { isSubmitting, initialValues }
}) {
  return isSubmitting ? (
    <LoadingSpinner loading={isSubmitting} />
  ) : (
    <button className="btn btn-primary" type="submit">
      {initialValues["customButtonName"]
        ? initialValues["customButtonName"]
        : "Save"}
    </button>
  );
});
/* tslint:enable:no-string-literal */
