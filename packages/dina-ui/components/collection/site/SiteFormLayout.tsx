import {
  DateField,
  MultilingualDescription,
  DinaFormSection,
  TextField,
  useDinaFormContext
} from "common-ui";
import {
  AttachmentsField,
  GroupSelectField
} from "packages/dina-ui/components";
import { DinaMessage, useDinaIntl } from "packages/dina-ui/intl/dina-ui-intl";
import { AllowAttachmentsConfig } from "packages/dina-ui/components/object-store";
import Link from "next/link";

export function SiteFormLayout({
  attachmentsConfig
}: {
  attachmentsConfig?: AllowAttachmentsConfig;
}) {
  const { formatMessage } = useDinaIntl();
  const { readOnly } = useDinaFormContext();

  return (
    <div>
      <div className="row">
        {!readOnly && (
          <GroupSelectField
            className="col-md-6"
            name="group"
            enableStoredDefaultGroup={true}
          />
        )}
      </div>
      <div className="row">
        <TextField
          className="col-md-6"
          name="name"
          label={formatMessage("name")}
        />
        <TextField
          className="col-md-6"
          name="code"
          label={formatMessage("code")}
        />
      </div>
      <MultilingualDescription />
      <div className="row">
        <DateField
          className="col-md-6"
          name="createdOn"
          label={formatMessage("field_createdOn")}
        />
        <TextField
          className="col-md-6"
          name="createdBy"
          label={formatMessage("field_createdBy")}
        />
      </div>

      {/* hard coded temporarily */}
      <div className="row">
        <label>
          <strong>Polygon</strong>
        </label>
        <div style={{ marginTop: "10px", marginBottom: "25px" }}>
          <Link href="/collection/site/polygon" className="btn btn-info">
            <DinaMessage id="viewOnMap" />
          </Link>
        </div>
      </div>

      <div className="mb-3">
        <DinaFormSection
          componentName="site-component"
          sectionName="site-attachments-section"
        >
          <AttachmentsField
            name="attachment"
            title={<DinaMessage id="siteAttachments" />}
            allowNewFieldName="attachmentsConfig.allowNew"
            allowExistingFieldName="attachmentsConfig.allowExisting"
            allowAttachmentsConfig={attachmentsConfig}
          />
        </DinaFormSection>
      </div>
    </div>
  );
}
