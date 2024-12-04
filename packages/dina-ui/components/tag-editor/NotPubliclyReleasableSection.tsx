import {
  DinaFormSection,
  InverseToggleField,
  RadioButtonsField,
  TextField,
  useBulkEditTabContext
} from "common-ui";
import { useFormikContext } from "formik";
import { DinaMessage } from "../../intl/dina-ui-intl";

export function NotPubliclyReleasableSection() {
  const isInBulkEditTab = !!useBulkEditTabContext();
  const formik = useFormikContext<any>();

  return (
    <>
      {isInBulkEditTab ? (
        <RadioButtonsField<boolean | null>
          name="publiclyReleasable"
          label={<DinaMessage id="notPubliclyReleasable" />}
          options={[
            // null values are ignored when bulk editing:
            {
              value: null,
              label: <DinaMessage id="dontChangeValues" />
            },
            // True and false are reversed to show "publiclyReleasable" as "notPubliclyReleasable".
            { value: false, label: <DinaMessage id="true" /> },
            { value: true, label: <DinaMessage id="false" /> }
          ]}
        />
      ) : (
        <InverseToggleField
          className="notPubliclyReleasable"
          name="publiclyReleasable"
          label={<DinaMessage id="notPubliclyReleasable" />}
        />
      )}
      <DinaFormSection horizontal={false}>
        {formik.values.publiclyReleasable !== undefined &&
          !formik.values.publiclyReleasable && (
            <TextField
              name="notPubliclyReleasableReason"
              className="flex-grow-1 notPubliclyReleasableReason"
              multiLines={true}
            />
          )}
      </DinaFormSection>
    </>
  );
}
