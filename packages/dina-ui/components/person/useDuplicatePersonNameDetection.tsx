import {
  AllowDuplicateButton,
  DoOperationsError,
  useDuplicateResourceCheck
} from "common-ui";
import { FormikContextType, useFormikContext } from "formik";
import { DinaMessage } from "../../intl/dina-ui-intl";

/**
 * A hook that provides a function to check for duplicate person names before saving.
 *
 * This is used in the PersonForm to prevent saving a person with a duplicate name unless the user explicitly allows it.
 * The hook uses the useDuplicateResourceCheck hook to perform the duplicate check and handle errors.
 */
export function useDuplicatePersonNameDetection() {
  const { withDuplicateCheck } = useDuplicateResourceCheck();

  async function withDuplicatePersonCheck<T>(
    fn: () => Promise<T>,
    formik: FormikContextType<any>
  ) {
    return withDuplicateCheck(fn, formik, (error) => {
      const fieldName =
        error instanceof DoOperationsError
          ? Object.keys(error.fieldErrorCodes).find(
              (field) => error.fieldErrorCodes[field] === "duplicate_resource"
            )
          : undefined;

      if (!fieldName) {
        return undefined;
      }
      return {
        fieldName,
        renderError: () => <DuplicatePersonNameError fieldName={fieldName} />
      };
    });
  }

  return { withDuplicatePersonCheck };
}

/** Builds a "Given Names Family Names (Display Name)" style label for a Person's form values. */
function getDuplicatePersonName(values: any): string {
  const namePart = [values?.givenNames, values?.familyNames]
    .filter((part) => part?.trim())
    .join(" ");

  if (namePart && values?.displayName) {
    return `${namePart} (${values.displayName})`;
  }
  return namePart || values?.displayName || "";
}

/** Error message with "Allow" button */
function DuplicatePersonNameError({ fieldName }: { fieldName: string }) {
  const { values } = useFormikContext<any>();
  const name = getDuplicatePersonName(values);

  return (
    <>
      <DinaMessage id="duplicatePersonFound" values={{ name }} />{" "}
      <AllowDuplicateButton
        fieldName={fieldName}
        allowDuplicateField="allowDuplicateName"
      >
        <DinaMessage id="allowDuplicate" />
      </AllowDuplicateButton>
    </>
  );
}
