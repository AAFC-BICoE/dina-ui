import { useApiClient } from "common-ui";
import { FormikContextType } from "formik";
import { PersistedResource } from "kitsu";
import { MaterialSample } from "../../../../dina-ui/types/collection-api";
import { DinaMessage } from "../../../intl/dina-ui-intl";
import { useState } from "react";

/** Hook to detect and warn about duplicate sample names.  */
export function useDuplicateSampleNameDetection() {
  const { apiClient } = useApiClient();
  const [allowedDuplicateName, setAllowedDuplicateName] = useState<
    string | null
  >(null);

  async function detectDuplicateSampleName(
    formik: FormikContextType<any>,
    sampleName?: string
  ): Promise<PersistedResource<MaterialSample> | null> {
    // Check for duplicate materialSampleName:
    if (sampleName && sampleName !== allowedDuplicateName) {
      try {
        const { data } = await apiClient.get<MaterialSample[]>(
          "collection-api/material-sample",
          {
            filter: { materialSampleName: { EQ: sampleName } },
            sort: "-createdOn"
          }
        );

        if (data.length) {
          const duplicate = data[0];
          formik.setFieldError(
            "materialSampleName",
            (
              <>
                <DinaMessage id="duplicatePrimaryIdFound" />{" "}
                <button
                  type="button"
                  className="btn btn-primary btn-sm allow-duplicate-button"
                  onClick={() => {
                    formik.setFieldError("materialSampleName", undefined);
                    setAllowedDuplicateName(sampleName);

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
            ) as any
          );

          return duplicate;
        }
      } catch (error) {
        // Do nothing
      }
    }
    return null;
  }

  return { detectDuplicateSampleName };
}
