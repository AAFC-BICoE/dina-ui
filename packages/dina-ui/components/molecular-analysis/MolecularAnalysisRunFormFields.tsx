import { MolecularAnalysisRunItem } from "../../types/seqdb-api/resources/MolecularAnalysisRunItem";
import {
  LoadingSpinner,
  TextField,
  useDinaFormContext,
  useQuery
} from "../../../common-ui/lib";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";
import { GroupSelectField } from "../group-select/GroupSelectField";
import { AttachmentsField } from "../object-store/attachment-list/AttachmentsField";

export function MolecularAnalysisRunFormFields() {
  // `seqdb-api/molecular-analysis-run-item?include=run,result&filter[rsql]=run.uuid==${id}`
  const { initialValues } = useDinaFormContext();
  const { formatMessage } = useDinaIntl();
  const molecularAnalysisRunItemQuery = useQuery<MolecularAnalysisRunItem>({
    path: `seqdb-api/molecular-analysis-run-item?include=run,result&filter[rsql]=run.uuid==${initialValues.id}`
  });
  return molecularAnalysisRunItemQuery.loading ? (
    <LoadingSpinner loading={true} />
  ) : (
    <div>
      <div className="row mb-3">
        <TextField
          className="col-md-6 name"
          name="name"
          label={formatMessage("field_molecularAnalysisRunName")}
        />
        <GroupSelectField
          name="group"
          enableStoredDefaultGroup={true}
          className="col-md-6"
        />
      </div>
      <AttachmentsField
        name="attachments"
        title={<DinaMessage id="molecularAnalysisResults" />}
        id="molecular-analysis-reults-section"
        allowNewFieldName="attachmentsConfig.allowNew"
        allowExistingFieldName="attachmentsConfig.allowExisting"
        attachmentPath={`seqdb-api/molecular-analysis-result/${molecularAnalysisRunItemQuery?.response?.data?.[0]?.result?.id}/attachments`}
        hideAddAttchmentBtn={true}
      />
    </div>
  );
}
