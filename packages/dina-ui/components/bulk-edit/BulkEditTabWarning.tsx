import {
  AreYouSureModal,
  BulkEditTabContextI,
  FormikButton,
  useBulkEditTabContext,
  useBulkEditTabField,
  useFieldLabels,
  useModal,
  FieldSpy
} from "common-ui";
import { PropsWithChildren, useEffect, useState } from "react";
import { DinaMessage } from "../../intl/dina-ui-intl";

export interface BulkEditTabWarningProps {
  fieldName: string;
  targetType: string;
  setDefaultValue?: (ctx: BulkEditTabContextI) => void;
  showWarningWhenValuesAreTheSame?: boolean;
}

export function BulkEditTabWarning({
  fieldName,
  setDefaultValue,
  targetType,
  children,
  showWarningWhenValuesAreTheSame
}: PropsWithChildren<BulkEditTabWarningProps>) {
  const bulkEditCtx = useBulkEditTabContext();
  const bulkField = useBulkEditTabField({ fieldName });
  const { openModal } = useModal();
  const { getFieldLabel } = useFieldLabels();

  const [manualOverride, setManualOverride] = useState(false);

  // Set the initial value based on the tab values:
  useEffect(() => {
    if (!bulkField || !bulkEditCtx) {
      return;
    }

    const { hasBulkEditValue, hasNoValues, hasSameValues, commonValue } =
      bulkField;

    if (!hasBulkEditValue) {
      if (hasNoValues) {
        setDefaultValue?.(bulkEditCtx);
      } else if (hasSameValues) {
        bulkEditCtx.bulkEditFormRef?.current?.setFieldValue(
          fieldName,
          commonValue
        );
      }
    }
  }, []);

  if (bulkEditCtx && bulkField) {
    const { hasBulkEditValue, hasNoValues, hasSameValues } = bulkField;

    const override = manualOverride || hasBulkEditValue;

    function overrideValues() {
      setManualOverride(true);
      if (bulkEditCtx) {
        setDefaultValue?.(bulkEditCtx);
      }
    }

    const singularFieldLabel = getFieldLabel({ name: fieldName })
      // Make the field name singular:
      .fieldLabel.replace(/s$/, "");

    // Don't show the "Multiple Values" warning + "Override All" button in certain cases:
    const skipBulkEditWarning =
      hasNoValues || (!showWarningWhenValuesAreTheSame && hasSameValues);

    return skipBulkEditWarning || override ? (
      <div>
        <FieldSpy fieldName={fieldName}>
          {(_, { bulkContext }) =>
            bulkContext?.hasBulkEditValue ? (
              <div className="alert alert-warning">
                <DinaMessage
                  id="bulkEditResourceSetWarningMulti"
                  values={{
                    targetType: getFieldLabel({ name: targetType }).fieldLabel,
                    fieldName: getFieldLabel({ name: fieldName }).fieldLabel
                  }}
                />
              </div>
            ) : null
          }
        </FieldSpy>
        <div>{children}</div>
      </div>
    ) : (
      <div className="multiple-values-warning mb-3">
        <div className="d-flex justify-content-center mb-2">
          <DinaMessage id="multipleValuesFound" />
        </div>
        <div className="d-flex justify-content-center">
          <FormikButton
            className="btn btn-primary override-all-button"
            onClick={() =>
              openModal(
                <AreYouSureModal
                  actionMessage={
                    <DinaMessage
                      id="overrideAllConfirmationTitle"
                      values={{ fieldName: singularFieldLabel }}
                    />
                  }
                  messageBody={
                    <DinaMessage
                      id="overrideAllConfirmation"
                      values={{ fieldName: singularFieldLabel }}
                    />
                  }
                  onYesButtonClicked={overrideValues}
                />
              )
            }
          >
            <DinaMessage id="overrideAll" />
          </FormikButton>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
