import { FormikContextType, useFormikContext } from "formik";
import { DinaMessage } from "../../../intl/dina-ui-intl";

/** Hook to detect and warn about duplicate sample names.  */
export function useDuplicateSampleNameDetection() {
  async function withDuplicateSampleNameCheck<T>(
    fn: () => Promise<T>,
    formik: FormikContextType<any>
  ) {
    try {
      return await fn();
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes("unique_material_sample_name")
      ) {
        // Replace the server's error message with a cusotm one on the UI:
        formik.setFieldError(
          "materialSampleName",
          (<DuplicateSampleNameError />) as any
        );
        throw new Error("");
      } else {
        throw error;
      }
    }
  }

  return { withDuplicateSampleNameCheck };
}

/** Error message with "Allow" button */
function DuplicateSampleNameError() {
  const formik = useFormikContext();
  return (
    <>
      <DinaMessage id="duplicatePrimaryIdFound" />{" "}
      <button
        type="button"
        className="btn btn-primary btn-sm allow-duplicate-button"
        onClick={() => {
          formik.setFieldValue("allowDuplicateName", true);
          formik.setFieldError("materialSampleName", undefined);

          // Non-react hack to add a success indicator when the "allow" button is clicked:
          setImmediate(() => {
            const input = document?.querySelector?.(
              ".materialSampleName-field input"
            );
            // Add the class:
            input?.classList?.add?.("is-valid");

            // Remove "is-valid" class on input change:
            input?.addEventListener("keydown", () =>
              input?.classList?.remove?.("is-valid")
            );
          });
        }}
      >
        <DinaMessage id="allowDuplicate" />
      </button>
    </>
  );
}
