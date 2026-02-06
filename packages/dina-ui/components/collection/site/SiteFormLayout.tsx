import {
  DateField,
  MultilingualDescription,
  DinaFormSection,
  TextField,
  useDinaFormContext
} from "common-ui";
import { AttachmentsField, GroupSelectField } from "../..";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { AllowAttachmentsConfig } from "../../object-store";

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
        <TextField
          className="col-md-6"
          name="code"
          label={formatMessage("code")}
        />
        {!readOnly && (
          <GroupSelectField
            className="col-md-6"
            name="group"
            enableStoredDefaultGroup={true}
          />
        )}
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
