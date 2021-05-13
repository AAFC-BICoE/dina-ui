import { connect } from "formik";
import { useEffect, useRef } from "react";

/** Renders the Formik status as an error message. */
export const ErrorViewer = connect(function ErrorViewerInternal({
  formik: { status }
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);

  // When there is a new error, scroll to it:
  useEffect(() => {
    if (status) {
      wrapperRef.current?.scrollIntoView?.();
    }
  }, [status]);

  return (
    <div ref={wrapperRef} style={{ scrollMargin: "20px" }}>
      {status ? (
        <div
          className="alert alert-danger"
          style={{ whiteSpace: "pre-wrap", wordWrap: "break-word" }}
        >
          {status}
        </div>
      ) : null}
    </div>
  );
});
