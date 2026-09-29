import {
  DoOperationsError,
  DuplicateResourceAlert,
  ExternalLink,
  useDuplicateResourceCheck
} from "common-ui";
import { useFormikContext } from "formik";
import { useState } from "react";
import { DinaMessage } from "../../intl/dina-ui-intl";

const UUID_PATTERN =
  /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

/**
 * Hook that wraps a Person save so a duplicate-name error from the API is shown as a
 * dismissable warning (instead of the raw backend error), letting the user view the
 * existing person or save the duplicate anyway.
 */
export function useDuplicatePersonNameDetection() {
  const { withDuplicateCheck, duplicate, allowDuplicate } =
    useDuplicateResourceCheck();
  const [existingPersonId, setExistingPersonId] = useState<string>();

  async function withDuplicatePersonCheck<T>(fn: () => Promise<T>) {
    return withDuplicateCheck(fn, (error) => {
      if (!(error instanceof DoOperationsError)) {
        return undefined;
      }
      const duplicateField = Object.keys(error.fieldErrorCodes).find(
        (field) => error.fieldErrorCodes[field] === "duplicate_resource"
      );
      if (!duplicateField) {
        return undefined;
      }

      // The API includes the existing person's id in the error's detail message:
      setExistingPersonId(
        String(error.fieldErrors[duplicateField]).match(UUID_PATTERN)?.[0]
      );

      // The duplicate check is based on givenNames + familyNames together,
      // regardless of which one the API's error is attached to:
      return ["givenNames", "familyNames"];
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
          <>
            <DinaMessage
              id="duplicatePersonFound"
              values={{ name: getDuplicatePersonName(formik.values) }}
            />
            {existingPersonId && (
              <>
                {" "}
                <ExternalLink href={`/person/view?id=${existingPersonId}`}>
                  <DinaMessage id="duplicatePersonViewLink" />
                </ExternalLink>
              </>
            )}
          </>
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
