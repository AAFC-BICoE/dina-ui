import {
  DinaFormSection,
  InverseToggleField,
  SelectField,
  TextField,
  useBulkEditTabContext
} from "common-ui";
import { useFormikContext } from "formik";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";

export function NotPubliclyReleasableSection() {
  const isInBulkEditTab = !!useBulkEditTabContext();
  const formik = useFormikContext<any>();
  const { formatMessage } = useDinaIntl();
  return (
    <>
      {isInBulkEditTab ? (
        <SelectField<boolean | null>
          name="publiclyReleasable"
          label={<DinaMessage id="notPubliclyReleasable" />}
          options={[
            // null values are ignored when bulk editing
            { label: formatMessage("dontChangeValues"), value: null },
            // True and false are reversed to show "publiclyReleasable" as "notPubliclyReleasable".
            { label: formatMessage("true"), value: false },
            { label: formatMessage("false"), value: true }
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
