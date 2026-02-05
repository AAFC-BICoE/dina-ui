import { DateField, MultilingualDescription, DinaFormSection } from "common-ui";
import { AttachmentsField } from "../..";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { AllowAttachmentsConfig } from "../../object-store";

export function SiteFormLayout({
  attachmentsConfig
}: {
  attachmentsConfig?: AllowAttachmentsConfig;
}) {
  const { formatMessage } = useDinaIntl();

  return (
    <div>
      <div className="row">
        <DateField
          className="col-md-6"
          name="group"
          label={formatMessage("group")}
        />
        <DateField
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
        <DateField
          className="col-md-6"
          name="createdBy"
          label={formatMessage("field_createdBy")}
        />
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
