import { connect, FormikContextType } from "formik";
import { LoadingSpinner } from "..";
import { CommonMessage } from "../intl/common-ui-intl";

interface SubmitButtonProps {
  children?: React.ReactNode;
  className?: string;
  hidePrimaryClass?: boolean;

  /** Override internal button props using the formik context. */
  buttonProps?: (
    ctx: FormikContextType<any>
  ) => React.HTMLProps<HTMLButtonElement>;
}

/**
 * Formik-connected submit button that shows a loading indicator instead when the form is submitting.
 */
export const SubmitButton = connect<SubmitButtonProps>(
  function SubmitButtonInternal({
    buttonProps,
    children,
    className,
    formik,
    hidePrimaryClass
  }) {
    const buttonPropsObj = buttonProps?.(formik) ?? {};

    return formik.isSubmitting ? (
      <LoadingSpinner loading={formik.isSubmitting} />
    ) : (
      <button
        {...buttonPropsObj}
        className={`btn ${className} ${hidePrimaryClass ? "" : "btn-primary"}`}
        style={{ ...buttonPropsObj.style, width: "10rem" }}
        type="submit"
      >
        {children || <CommonMessage id="submitBtnText" />}
      </button>
    );
  }
);
