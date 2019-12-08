import { connect } from "formik";
import { LoadingSpinner } from "..";
import { CommonMessage } from "../intl/common-ui-intl";

interface SubmitButtonProps {
  children?: React.ReactNode;
}

/**
 * Formik-connected submit button that shows a loading indicator instead when the form is submitting.
 */
export const SubmitButton = connect<SubmitButtonProps>(
  function SubmitButtonInternal({ children, formik: { isSubmitting } }) {
    return isSubmitting ? (
      <LoadingSpinner loading={isSubmitting} />
    ) : (
      <button className="btn btn-primary" type="submit">
        {children || <CommonMessage id="submitBtnText" />}
      </button>
    );
  }
);
