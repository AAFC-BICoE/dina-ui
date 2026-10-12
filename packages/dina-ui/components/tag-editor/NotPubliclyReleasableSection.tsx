import {
  DinaFormSection,
  SelectField,
  TextField,
  useBulkEditTabContext,
  Tooltip
} from "common-ui";
import { useFormikContext } from "formik";
import { useEffect } from "react";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";
import { FaGlobe } from "react-icons/fa";

export interface NotPubliclyReleasableSectionProps {
  defaultToNotReleasable?: boolean;
  horizontal?: boolean | [number, number] | "flex" | number;
}
export function NotPubliclyReleasableSection({
  defaultToNotReleasable,
  horizontal = false
}: NotPubliclyReleasableSectionProps = {}) {
  const isInBulkEditTab = !!useBulkEditTabContext();
  const formik = useFormikContext<any>();
  const { formatMessage } = useDinaIntl();

  const shouldSetDefault =
    defaultToNotReleasable !== undefined &&
    formik.values.publiclyReleasable == null &&
    !formik.values.id &&
    !formik.initialValues.id;

  useEffect(() => {
    if (shouldSetDefault) {
      // Default the field for new records: true -> not releasable, false -> releasable.
      formik.setFieldValue("publiclyReleasable", !defaultToNotReleasable);
    }
  }, [shouldSetDefault]);
  return (
    <>
      <DinaFormSection horizontal={horizontal}>
        {isInBulkEditTab ? (
          <Tooltip
            id="bulkEditNotPubliclyReleasableTooltip"
            intlValues={{
              keepCurrentValues: formatMessage("keepCurrentValues")
            }}
            visibleElement={
              <SelectField<boolean | null>
                name="publiclyReleasable"
                removeBottomMargin={true}
                label={
                  <span>
                    <FaGlobe className="me-2" />
                    <DinaMessage id="publiclyReleasable" />
                  </span>
                }
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
            label={
              <span>
                <FaGlobe className="me-2" />
                <DinaMessage id="publiclyReleasable" />
              </span>
            }
            removeBottomMargin={true}
            options={[
              { label: formatMessage("publiclyReleasableOption"), value: true },
              {
                label: formatMessage("notPubliclyReleasableOption"),
                value: false
              }
            ]}
          />
        )}
      </DinaFormSection>
      <DinaFormSection horizontal={horizontal}>
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
