import { connect } from "formik";
import { LoadingSpinner } from "..";

/**
 * Formik-connected submit button that shows a loading indicator instead when the form is submitting.
 */

/* tslint:disable:no-string-literal */

interface SubmitButtonProps {
  className?: string;
  children?: React.ReactNode;
}

export const SubmitButton = connect<SubmitButtonProps>(
  function SubmitButtonInternal({
    formik: { isSubmitting },
    className,
    children
  }) {
    return isSubmitting ? (
      <LoadingSpinner loading={isSubmitting} />
    ) : (
      <button
        className={className ? className : "btn btn-primary"}
        type="submit"
      >
        {children ? children : "Save"}
      </button>
    );
  }
);
/* tslint:enable:no-string-literal */
