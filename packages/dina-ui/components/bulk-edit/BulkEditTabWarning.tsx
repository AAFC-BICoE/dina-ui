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
  messageIdSingle: string;
  messageIdMultiple: string;
  setDefaultValue?: (ctx: BulkEditTabContextI) => void;
  showWarningWhenValuesAreTheSame?: boolean;
}

/**
 * Displays a warning and override option in bulk edit tabs when multiple values are detected for a field.
 *
 * This component checks the bulk edit context and field state to determine whether to show a warning
 * about multiple values, and provides an "Override All" button to set a default value for all items.
 * The warning and override button are conditionally rendered based on the field's state and props.
 *
 * @param fieldName - The name of the field being edited in bulk.
 * @param setDefaultValue - Optional callback to set the default value for the field in the bulk edit context.
 * @param messageIdSingle - DinaMessage ID to display when only one value is present.
 * @param messageIdMultiple - DinaMessage ID to display when multiple values are present.
 * @param children - Child components to render within the warning container.
 * @param showWarningWhenValuesAreTheSame - If false, suppresses the warning when all values are the same.
 *
 * @returns JSX element displaying the warning and override button, or just children if no warning is needed.
 */
export function BulkEditTabWarning({
  fieldName,
  setDefaultValue,
  messageIdSingle,
  messageIdMultiple,
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
  }, [bulkEditCtx, bulkField]);

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
          {(fieldValue: Array<any>, { bulkContext }) =>
            bulkContext?.hasBulkEditValue && fieldValue.length ? (
              <div className="alert alert-warning">
                {fieldValue.length == 1 ? (
                  <DinaMessage id={messageIdSingle as any} />
                ) : (
                  <DinaMessage id={messageIdMultiple as any} />
                )}
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
        <div>{children}</div>
      </div>
    );
  }

  return <>{children}</>;
}
