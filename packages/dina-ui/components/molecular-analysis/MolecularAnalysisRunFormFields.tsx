import { TextField, useDinaFormContext } from "../../../common-ui/lib";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";
import { GroupSelectField } from "../group-select/GroupSelectField";
import { AttachmentsField } from "../object-store/attachment-list/AttachmentsField";

export function MolecularAnalysisRunFormFields() {
  const { initialValues, readOnly } = useDinaFormContext();
  const { formatMessage } = useDinaIntl();
  return (
    <div>
      <div className="row">
        <TextField
          className="col-md-6 name"
          name="run.name"
          label={formatMessage("field_molecularAnalysisRunName")}
        />
        <GroupSelectField
          name="group"
          enableStoredDefaultGroup={true}
          className="col-md-6"
        />
      </div>
      <AttachmentsField
        name="result.attachments"
        title={<DinaMessage id="molecularAnalysisResults" />}
        id="molecular-analysis-reults-section"
        allowNewFieldName="attachmentsConfig.allowNew"
        allowExistingFieldName="attachmentsConfig.allowExisting"
        attachmentPath={`seqdb-api/molecular-analysis-result/${initialValues?.result?.id}`}
        hideAddAttchmentBtn={true}
      />
    </div>
  );
}
