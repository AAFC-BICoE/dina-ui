import { FormikButton } from "common-ui";
import { PropsWithChildren, useState, useEffect } from "react";
import {
  useBulkEditTabContext,
  isBlankResourceAttribute,
  BulkEditTabContextI
} from "..";
import { DinaMessage } from "../../intl/dina-ui-intl";
import { get, isEqual } from "lodash";

export interface BulkEditTabWarningProps {
  fieldName: string;
  setDefaultValue?: (ctx: BulkEditTabContextI) => void;
}

export function BulkEditTabWarning({
  fieldName,
  setDefaultValue,
  children
}: PropsWithChildren<BulkEditTabWarningProps>) {
  const bulkEditCtx = useBulkEditTabContext();
  const [override, setOverride] = useState(false);

  if (bulkEditCtx) {
    function overrideValues() {
      setOverride(true);
      if (bulkEditCtx) {
        setDefaultValue?.(bulkEditCtx);
      }
    }

    const { sampleHooks, bulkEditFormRef } = bulkEditCtx;

    const formStates = sampleHooks.map(
      sample => sample.formRef?.current?.values
    );

    const hasNoValues = formStates.every(form =>
      isBlankResourceAttribute(get(form, fieldName))
    );

    const hasDifferentValues = !formStates.every(form =>
      isEqual(
        get(form, fieldName),
        get(sampleHooks[0].formRef?.current?.values, fieldName)
      )
    );

    const hasSameValues = !hasDifferentValues;

    // Set the initial value based on the tab values:
    useEffect(() => {
      if (hasNoValues) {
        setDefaultValue?.(bulkEditCtx);
      } else if (hasSameValues) {
        const commonValue = get(formStates[0], fieldName);
        bulkEditFormRef?.current?.setFieldValue(fieldName, commonValue);
      }
    }, []);

    return hasNoValues || override || hasSameValues ? (
      <>{children}</>
    ) : (
      <div className="multiple-values-warning mb-3">
        <div className="d-flex justify-content-center mb-2">
          <DinaMessage id="multipleValuesFound" />
        </div>
        <div className="d-flex justify-content-center">
          <FormikButton
            className="btn btn-primary override-all-button"
            onClick={overrideValues}
          >
            <DinaMessage id="overrideAll" />
          </FormikButton>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
