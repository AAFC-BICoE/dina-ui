import { FormikContextType, useFormikContext } from "formik";
import { ReactNode } from "react";

/** Hook to wrap a form submit so a duplicate-resource save error can be replaced with a friendly message and an override option, instead of the raw backend error. */
export function useDuplicateResourceCheck() {
  async function withDuplicateCheck<T>(
    fn: () => Promise<T>,
    formik: FormikContextType<any>,
    /** Given the caught save error, the field to flag and its replacement message, or undefined if this isn't a duplicate-resource error. */
    getDuplicateError: (
      error: unknown
    ) => { fieldName: string; renderError: () => ReactNode } | undefined
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      const duplicate = getDuplicateError(error);
      if (!duplicate) {
        throw error;
      }
      // Replace the server's error message with a custom one on the UI:
      formik.setFieldError(duplicate.fieldName, duplicate.renderError as any);
      throw new Error("");
    }
  }

  return { withDuplicateCheck };
}

export interface AllowDuplicateButtonProps {
  /** The Formik field whose error is being overridden. */
  fieldName: string;
  /** The Formik field to set to true once the user opts to save the duplicate anyway. */
  allowDuplicateField: string;
  children: ReactNode;
}

/** Button shown alongside a duplicate-resource error, letting the user opt in to saving anyway. */
export function AllowDuplicateButton({
  fieldName,
  allowDuplicateField,
  children
}: AllowDuplicateButtonProps) {
  const formik = useFormikContext<any>();

  return (
    <button
      type="button"
      className="btn btn-primary btn-sm allow-duplicate-button"
      onClick={() => {
        formik.setFieldValue(allowDuplicateField, true);
        formik.setFieldError(fieldName, undefined);

        // Non-react hack to add a success indicator when the "allow" button is clicked:
        setImmediate(() => {
          const input = document?.querySelector?.(`.${fieldName}-field input`);
          // Add the class:
          input?.classList?.add?.("is-valid");

          // Remove "is-valid" class on input change:
          input?.addEventListener("keydown", () =>
            input?.classList?.remove?.("is-valid")
          );
        });
      }}
    >
      {children}
    </button>
  );
}
