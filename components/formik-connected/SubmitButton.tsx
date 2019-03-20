import { connect } from "formik";
import { LoadingSpinner } from "..";

export const SubmitButton = connect(function SubmitButtonInternal({
  formik: { isSubmitting }
}) {
  return isSubmitting ? (
    <LoadingSpinner loading={isSubmitting} />
  ) : (
    <button className="btn btn-primary" type="submit">
      Submit
    </button>
  );
});
