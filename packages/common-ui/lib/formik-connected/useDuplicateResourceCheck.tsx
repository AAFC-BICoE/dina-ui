import { FormikContextType } from "formik";
import { ReactNode, useState } from "react";

export interface DuplicateResourceMatch {
  /** The fields to highlight as invalid until the user allows the duplicate. */
  highlightFields: string[];
}

/** Hook to wrap a form submit so a duplicate-resource save error can be shown as a dismissable warning with an override option, instead of the raw backend error. */
export function useDuplicateResourceCheck() {
  const [duplicate, setDuplicate] = useState<DuplicateResourceMatch>();

  async function withDuplicateCheck<T>(
    fn: () => Promise<T>,
    /** Given the caught save error, the fields to highlight, or undefined if this isn't a duplicate-resource error. */
    getDuplicateFields: (error: unknown) => string[] | undefined
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      const highlightFields = getDuplicateFields(error);
      if (!highlightFields?.length) {
        throw error;
      }
      setDuplicate({ highlightFields });
      setImmediate(() =>
        forEachFieldInput(highlightFields, (input) =>
          input.classList.add("is-invalid")
        )
      );
      throw new Error("");
    }
  }

  /** Dismisses the warning and lets the flagged fields' values be saved as-is on the next submit. */
  function allowDuplicate(
    formik: FormikContextType<any>,
    allowDuplicateField: string
  ) {
    if (!duplicate) {
      return;
    }
    const { highlightFields } = duplicate;
    formik.setFieldValue(allowDuplicateField, true);
    setDuplicate(undefined);

    // Non-react hack to add a success indicator when the "allow" button is clicked:
    setImmediate(() =>
      forEachFieldInput(highlightFields, (input) => {
        input.classList.remove("is-invalid");
        input.classList.add("is-valid");

        // Remove "is-valid" class on input change:
        input.addEventListener("keydown", () =>
          input.classList.remove("is-valid")
        );
      })
    );
  }

  return { withDuplicateCheck, duplicate, allowDuplicate };
}

function forEachFieldInput(
  fieldNames: string[],
  fn: (input: HTMLInputElement) => void
) {
  for (const fieldName of fieldNames) {
    const input = document?.querySelector?.(`.${fieldName}-field input`);
    if (input) {
      fn(input as HTMLInputElement);
    }
  }
}

export interface DuplicateResourceAlertProps {
  message: ReactNode;
  allowLabel: ReactNode;
  onAllow: () => void;
}

/** A dismissable warning banner shown when a duplicate resource is detected, with an override option. */
export function DuplicateResourceAlert({
  message,
  allowLabel,
  onAllow
}: DuplicateResourceAlertProps) {
  return (
    <div className="alert alert-warning d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
      <span>{message}</span>
      <button
        type="button"
        className="btn btn-primary btn-sm allow-duplicate-button flex-shrink-0"
        onClick={onAllow}
      >
        {allowLabel}
      </button>
    </div>
  );
}
