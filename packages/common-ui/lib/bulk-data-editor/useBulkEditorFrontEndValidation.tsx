import { isEmpty } from "lodash";
import { useState } from "react";
import { CommonMessage } from "../intl/common-ui-intl";

interface ValidationError {
  value: string;
  row: number;
}

type ValidationErrorState = {
  [source: string]: ValidationError;
};

export function useBulkEditorFrontEndValidation() {
  // Client-side validation errors caught by the handsontable's built-in error catching.
  // These should prevent submission of the table:
  const [validationErrors, setValidationErrors] =
    useState<ValidationErrorState>({});

  const hasValidationErrors = !isEmpty(validationErrors);

  function afterValidate(
    isValid: boolean,
    value: any,
    row: number,
    property: string | number
  ) {
    const key = `${property}:${row}`;
    if (isValid) {
      delete validationErrors[key];
      setValidationErrors({ ...validationErrors });
    } else {
      validationErrors[key] = { value, row: row + 1 };
      setValidationErrors({ ...validationErrors });
    }

    return isValid;
  }

  return {
    hasValidationErrors,
    afterValidate,
    validationAlertJsx: hasValidationErrors ? (
      <div className="alert alert-danger">
        {Object.values(validationErrors).map(({ row, value }, idx) => (
          <div key={idx}>
            <CommonMessage
              id="bulkEditorValidationError"
              values={{ row, value }}
            />
          </div>
        ))}
      </div>
    ) : null
  };
}
