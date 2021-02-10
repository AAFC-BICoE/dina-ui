import { connect } from "formik";

/** Renders the Formik status as an error message. */
export const ErrorViewer = connect(function ErrorViewerInternal({
  formik: { status }
}) {
  return status ? (
    <div
      className="alert alert-danger"
      style={{ whiteSpace: "pre-wrap", wordWrap: "break-word" }}
    >
      {status}
    </div>
  ) : null;
});
