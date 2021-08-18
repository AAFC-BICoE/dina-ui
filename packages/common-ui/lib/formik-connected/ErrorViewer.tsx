import { connect } from "formik";
import { toPairs } from "lodash";
import { useEffect, useMemo, useRef } from "react";
import { useFieldLabels } from "../field-header/FieldHeader";

/** Renders the Formik status as an error message. */
export const ErrorViewer = connect(function ErrorViewerInternal({
  formik: { isSubmitting, errors, status }
}) {
  const { getFieldLabel } = useFieldLabels();
  const wrapperRef = useRef<HTMLDivElement>(null);

  /** A string of form-level and field-level error messages. */
  const errorMessage = useMemo(
    () => {
      const fieldErrorMsg = toPairs(errors)
        .map(
          ([field, error], index) =>
            `${index + 1} : ${
              getFieldLabel({ name: field }).fieldLabel
            } - ${error}`
        )
        .join("\n");

      return [status, fieldErrorMsg].filter(it => it).join("\n\n") || null;
    },
    // Only update the form-level error message on form submit:
    [isSubmitting]
  );

  // When there is a new error, scroll to it:
  useEffect(() => {
    if (errorMessage) {
      wrapperRef.current?.scrollIntoView?.();
    }
  }, [errorMessage]);

  return (
    <div ref={wrapperRef} style={{ scrollMargin: "20px" }}>
      {errorMessage && (
        <div
          className="alert alert-danger"
          role="status"
          style={{ whiteSpace: "pre-wrap", wordWrap: "break-word" }}
        >
          {errorMessage}
        </div>
      )}
    </div>
  );
});
