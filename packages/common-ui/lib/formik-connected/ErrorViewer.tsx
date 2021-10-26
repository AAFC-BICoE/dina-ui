import { connect } from "formik";
import { compact, toPairs } from "lodash";
import { useEffect, useMemo, useRef } from "react";
import { useFieldLabels } from "../field-header/FieldHeader";

/** Renders the Formik status as an error message. */
export const ErrorViewer = connect(function ErrorViewerInternal({
  // "status" is the form-level error, and
  // "errors" are the field-level errors.
  formik: { isSubmitting, errors, status }
}) {
  const { getFieldLabel } = useFieldLabels();
  const wrapperRef = useRef<HTMLDivElement>(null);

  /** A string of form-level and field-level error messages. */
  const errorMessages = useMemo(
    () => {
      const fieldErrors = toPairs(errors).map(([field, error], index) =>
        error ? (
          <div className="error-message">
            {index + 1} : {getFieldLabel({ name: field }).fieldLabel} - {error}
          </div>
        ) : null
      );

      return compact([status, ...fieldErrors]);
    },
    // Update the form-level error message on form submit or when errors change:
    [isSubmitting, errors]
  );

  // When there is a new error, scroll to it:
  useEffect(() => {
    if (errorMessages.length) {
      wrapperRef.current?.scrollIntoView?.();
    }
  }, [errorMessages]);

  return (
    <div ref={wrapperRef} style={{ scrollMargin: "20px" }}>
      {errorMessages.length ? (
        <div className="alert alert-danger" role="status">
          {errorMessages.map((msg, idx) => (
            <div key={idx}>{msg}</div>
          ))}
        </div>
      ) : null}
    </div>
  );
});
