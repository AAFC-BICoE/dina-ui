import {
  DoOperationsError,
  DuplicateResourceAlert,
  useDuplicateResourceCheck
} from "common-ui";
import { useFormikContext } from "formik";
import { DinaMessage } from "../../intl/dina-ui-intl";

/**
 * Hook that wraps a Person save so a duplicate-name error from the API is shown as a
 * dismissable warning (instead of the raw backend error), letting the user save the
 * duplicate anyway.
 */
export function useDuplicatePersonNameDetection() {
  const { withDuplicateCheck, duplicate, allowDuplicate } =
    useDuplicateResourceCheck();

  async function withDuplicatePersonCheck<T>(fn: () => Promise<T>) {
    return withDuplicateCheck(fn, (error) => {
      const isDuplicateName =
        error instanceof DoOperationsError &&
        Object.values(error.fieldErrorCodes).includes("duplicate_resource");

      // The duplicate check is based on givenNames + familyNames together,
      // regardless of which one the API's error is attached to:
      return isDuplicateName ? ["givenNames", "familyNames"] : undefined;
    });
  }

  function DuplicatePersonAlert() {
    const formik = useFormikContext<any>();
    if (!duplicate) {
      return null;
    }
    return (
      <DuplicateResourceAlert
        message={
          <DinaMessage
            id="duplicatePersonFound"
            values={{ name: getDuplicatePersonName(formik.values) }}
          />
        }
        allowLabel={<DinaMessage id="allowDuplicate" />}
        onAllow={() => allowDuplicate(formik, "allowDuplicateName")}
      />
    );
  }

  return { withDuplicatePersonCheck, DuplicatePersonAlert };
}

/** Builds a "Given Names Family Names" style label for a Person's form values. */
function getDuplicatePersonName(values: any): string {
  return [values?.givenNames, values?.familyNames]
    .filter((part) => part?.trim())
    .join(" ");
}
