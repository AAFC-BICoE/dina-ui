import { FormikButton } from "common-ui";
import { PropsWithChildren, useState } from "react";
import { useBulkEditTabContext, isBlankResourceAttribute } from "..";
import { DinaMessage } from "../../intl/dina-ui-intl";
import { get, isEqual } from "lodash";

export interface BulkEditTabWarningProps {
  fieldName: string;
}

export function BulkEditTabWarning({
  fieldName,
  children
}: PropsWithChildren<BulkEditTabWarningProps>) {
  const bulkEditCtx = useBulkEditTabContext();
  const [override, setOverride] = useState(false);

  if (bulkEditCtx) {
    const { sampleHooks } = bulkEditCtx;

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

    // console.log({ hasNoValues, hasDifferentValues, hasSameValues, formStates });

    return (
      <div>
        {hasNoValues ? (
          children
        ) : hasSameValues ? (
          // todo
          children
        ) : (
          <div className="d-flex justify-content-center">
            <DinaMessage id="multipleValuesFound" />
            <FormikButton
              className="btn btn-primary"
              onClick={async (_, form) => setOverride(true)}
            >
              <DinaMessage id="overrideAll" />
            </FormikButton>
          </div>
        )}
      </div>
    );
  }

  return <div>{children}</div>;
}
