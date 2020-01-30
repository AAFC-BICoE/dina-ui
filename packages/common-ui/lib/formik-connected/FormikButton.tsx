import { connect } from "formik";
import { LoadingSpinner, OnFormikSubmit, safeSubmit } from "..";

interface FormikButtonProps {
  className?: string;
  children?: React.ReactNode;
  onClick: OnFormikSubmit;
}

/**
 * Formik-connected button for click events other than main form submissions.
 */
export const FormikButton = connect<FormikButtonProps>(
  ({ className, children, formik, onClick }) =>
    formik.isSubmitting ? (
      <LoadingSpinner loading={true} />
    ) : (
      <button
        className={className}
        onClick={() => safeSubmit(onClick)(formik.values, formik)}
        type="button"
      >
        {children}
      </button>
    )
);
