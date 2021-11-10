import { useFormikContext } from "formik";
import { last, toPairs } from "lodash";
import { useEffect, useMemo, useRef } from "react";
import { treeToFlatMap } from "tree-to-flat-map";
import { useFieldLabels } from "../field-header/FieldHeader";

/** Renders the Formik status as an error message. */
export function ErrorViewer() {
  const { isSubmitting, errors, status } = useFormikContext();
  const { getFieldLabel } = useFieldLabels();
  const wrapperRef = useRef<HTMLDivElement>(null);

  /** A string of form-level and field-level error messages. */
  const errorMessage = useMemo(
    () => {
      const fieldErrorMsg = toPairs(treeToFlatMap(errors))
        .map(
          ([field, error]) =>
            `${
              getFieldLabel({ name: String(last(field.split("."))) }).fieldLabel
            }: ${error}`
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
          style={{ whiteSpace: "pre-wrap", wordWrap: "break-word" }}
          role="status"
        >
          {errorMessage}
        </div>
      )}
    </div>
  );
}
