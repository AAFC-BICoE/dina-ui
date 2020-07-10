import { connect, FormikContextType } from "formik";
import { LoadingSpinner, OnFormikSubmit, safeSubmit } from "..";

interface FormikButtonProps {
  className?: string;
  children?: React.ReactNode;
  onClick: OnFormikSubmit;

  /** Override internal button props using the formik context. */
  buttonProps?: (
    ctx: FormikContextType<any>
  ) => React.HTMLProps<HTMLButtonElement>;
}

/**
 * Formik-connected button for click events other than main form submissions.
 */
export const FormikButton = connect<FormikButtonProps>(
  ({ buttonProps, className, children, formik, onClick }) =>
    formik.isSubmitting ? (
      <LoadingSpinner loading={true} />
    ) : (
      <button
        {...buttonProps?.(formik)}
        className={className}
        onClick={() => safeSubmit(onClick)(formik.values, formik)}
        type="button"
      >
        {children}
      </button>
    )
);
