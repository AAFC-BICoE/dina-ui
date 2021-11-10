import { flatten } from "flat";
import { useFormikContext } from "formik";
import { compact, last, toPairs } from "lodash";
import { useEffect, useMemo, useRef } from "react";
import { useFieldLabels } from "../field-header/FieldHeader";

/** Renders the Formik status as an error message. */
export function ErrorViewer() {
  const { isSubmitting, errors, status } = useFormikContext();
  const { getFieldLabel } = useFieldLabels();
  const wrapperRef = useRef<HTMLDivElement>(null);

  /** A string of form-level and field-level error messages. */
  const errorMessage = useMemo(
    () => {
      const fieldErrorMsg = toPairs(flatten(errors))
        .map(([field, error]) => {
          const { fieldLabel } = getFieldLabel({
            name: String(last(field.split(".")))
          });
          return `${fieldLabel}: ${error}`;
        })
        .join("\n");

      return compact([status, fieldErrorMsg]).join("\n\n") || null;
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
          style={{ whiteSpace: "pre-wrap", wordWrap: "break-word" }}
          role="status"
        >
          {errorMessage}
        </div>
      )}
    </div>
  );
}
