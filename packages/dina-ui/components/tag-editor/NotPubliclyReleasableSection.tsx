import {
  DinaFormSection,
  SelectField,
  TextField,
  useBulkEditTabContext,
  Tooltip
} from "common-ui";
import { useFormikContext } from "formik";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";

export function NotPubliclyReleasableSection() {
  const isInBulkEditTab = !!useBulkEditTabContext();
  const formik = useFormikContext<any>();
  const { formatMessage } = useDinaIntl();

  if (
    !isInBulkEditTab &&
    formik.values.publiclyReleasable == null &&
    !formik.values.id
  ) {
    // Default to "not publicly Releasable" (false) by default for new records.
    formik.setFieldValue("publiclyReleasable", false);
  }
  return (
    <>
      {isInBulkEditTab ? (
        <Tooltip
          id="bulkEditNotPubliclyReleasableTooltip"
          intlValues={{
            keepCurrentValues: formatMessage("keepCurrentValues")
          }}
          visibleElement={
            <SelectField<boolean | null>
              name="publiclyReleasable"
              label={<DinaMessage id="publiclyReleasable" />}
              options={[
                // null values are ignored when bulk editing
                { label: formatMessage("keepCurrentValues"), value: null },
                // True and false are reversed to show "publiclyReleasable" as "notPubliclyReleasable".
                {
                  label: formatMessage("notPubliclyReleasableOption"),
                  value: false
                },
                {
                  label: formatMessage("publiclyReleasableOption"),
                  value: true
                }
              ]}
            />
          }
        />
      ) : (
        <SelectField<boolean>
          className="notPubliclyReleasable"
          name="publiclyReleasable"
          label={<DinaMessage id="publiclyReleasable" />}
          options={[
            { label: formatMessage("publiclyReleasableOption"), value: true },
            {
              label: formatMessage("notPubliclyReleasableOption"),
              value: false
            }
          ]}
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
