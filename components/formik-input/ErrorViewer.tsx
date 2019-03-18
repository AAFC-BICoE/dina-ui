import { connect } from "formik";

export const ErrorViewer = connect(function ErrorViewerInternal({
  formik: { status }
}) {
  return status ? <div className="alert alert-danger">{status}</div> : null;
});
