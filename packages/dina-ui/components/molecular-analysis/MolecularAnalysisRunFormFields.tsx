import {
  LoadingSpinner,
  ReactTable,
  TextField,
  useDinaFormContext
} from "../../../common-ui/lib";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";
import { GroupSelectField } from "../group-select/GroupSelectField";
import { AttachmentReadOnlySection } from "../object-store/attachment-list/AttachmentReadOnlySection";
import { QualityControlSection } from "../seqdb/molecular-analysis-workflow/QualityControlSection";
import { SequencingRunItem } from "./useMolecularAnalysisRun";
import { SeqdbMessage } from "../../intl/seqdb-intl";
import { useMolecularAnalysisRunView } from "./useMolecularAnalysisRunView";

export function MolecularAnalysisRunFormFields() {
  const { initialValues } = useDinaFormContext();
  const { formatMessage } = useDinaIntl();

  const {
    loading,
    sequencingRunItems,
    columns,
    qualityControls,
    qualityControlTypes
  } = useMolecularAnalysisRunView({
    molecularAnalysisRunId: initialValues.id
  });

  return loading ? (
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
      <div className="col-12 mb-3">
        <strong>
          <SeqdbMessage id="molecularAnalysisRunItems" />
        </strong>
        <ReactTable<SequencingRunItem>
          className="-striped mt-2"
          columns={columns}
          data={sequencingRunItems ?? []}
          sort={[{ id: "wellCoordinates", desc: false }]}
        />
      </div>
      {/* Sequencing Quality Control */}
      <QualityControlSection
        qualityControls={qualityControls}
        qualityControlTypes={qualityControlTypes}
        editMode={false}
        loading={loading}
      />
      <div className="col-12 mt-3">
        <AttachmentReadOnlySection
          name="attachments"
          attachmentParentBaseApi="seqdb-api"
          attachmentParentType="molecular-analysis-run"
          attachmentParentId={initialValues.id!}
          title={<DinaMessage id="molecularAnalysisRunStep_attachments" />}
        />
      </div>
    </div>
  );
}
