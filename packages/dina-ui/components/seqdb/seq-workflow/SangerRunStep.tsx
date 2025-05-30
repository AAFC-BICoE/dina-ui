import Link from "next/link";
import { SeqBatch } from "../../../types/seqdb-api";
import {
  SequencingRunItem,
  useMolecularAnalysisRun
} from "../../molecular-analysis/useMolecularAnalysisRun";
import { DinaForm, LoadingSpinner, ReactTable } from "common-ui";
import { Alert } from "react-bootstrap";
import { DinaMessage } from "../../../intl/dina-ui-intl";
import { AttachmentsEditor } from "../../object-store/attachment-list/AttachmentsField";
import { AttachmentReadOnlySection } from "../../object-store/attachment-list/AttachmentReadOnlySection";

export interface SangerRunStepProps {
  seqBatchId: string;
  seqBatch: SeqBatch;
  editMode: boolean;
  setEditMode: (newValue: boolean) => void;
  performSave: boolean;
  setPerformSave: (newValue: boolean) => void;
}

export function SangerRunStep({
  seqBatchId,
  editMode,
  setEditMode,
  performSave,
  setPerformSave
}: SangerRunStepProps) {
  const {
    loading,
    errorMessage,
    multipleRunWarning,
    setSequencingRunName,
    sequencingRunName,
    sequencingRunItems,
    columns,
    attachments,
    setAttachments,
    sequencingRunId
  } = useMolecularAnalysisRun({
    editMode,
    setEditMode,
    performSave,
    setPerformSave,
    seqBatchId
  });

  // Display loading if network requests from hook are still loading in...
  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center">
        <LoadingSpinner loading={true} />
      </div>
    );
  }

  return (
    <>
      {/* Multiple Runs Exist Warning */}
      {multipleRunWarning && (
        <div className="row">
          <div className="col-12">
            <Alert variant="warning" className="mb-0">
              <Alert.Heading>
                <DinaMessage id="sangerRunStep_multipleRunWarning_title" />
              </Alert.Heading>
              <p>
                <DinaMessage id="sangerRunStep_multipleRunWarning_description" />
              </p>
            </Alert>
          </div>
        </div>
      )}
      {/* Error Message */}
      {errorMessage && (
        <div className="row">
          <div className="col-12">
            <Alert variant="danger" className="mb-2">
              {errorMessage}
            </Alert>
          </div>
        </div>
      )}
      {/* Run Information */}
      {editMode ||
      sequencingRunItems?.some((item) => item.molecularAnalysisRunItemId) ? (
        <div className="row mt-4">
          <div className="col-4 mb-3">
            <strong>
              <DinaMessage id="sangerRunStep_sequencingRun" />
            </strong>
            {editMode ? (
              <input
                className="form-control mt-1"
                name="sequencingRunName"
                value={sequencingRunName}
                onChange={(newValue) =>
                  setSequencingRunName(newValue.target.value ?? "")
                }
              />
            ) : (
              <p>{sequencingRunName}</p>
            )}
          </div>
          <div className="col-8 mb-3">
            {/* Worksheet Buttton */}
            {!editMode && (
              <div className="row">
                <div className="col-12 text-end">
                  <Link
                    href={`/seqdb/seq-workflow/worksheet?id=${seqBatchId}`}
                    target="_blank"
                    className="btn btn-primary"
                  >
                    <DinaMessage id="worksheet" />
                  </Link>
                </div>
              </div>
            )}
          </div>
          <div className="col-12">
            <strong>
              <DinaMessage id="sangerRunStep_sequencingRunContent" />
            </strong>
            <ReactTable<SequencingRunItem>
              className="-striped mt-2"
              columns={columns}
              data={sequencingRunItems ?? []}
              sort={[{ id: "wellCoordinates", desc: false }]}
            />
          </div>
          <div className="col-12 mt-3">
            <DinaForm initialValues={{}}>
              {editMode ? (
                <AttachmentsEditor
                  attachmentPath={``}
                  name="attachments"
                  onChange={setAttachments}
                  value={attachments}
                  title={
                    <DinaMessage id="molecularAnalysisRunStep_attachments" />
                  }
                />
              ) : (
                <>
                  {sequencingRunId && (
                    <AttachmentReadOnlySection
                      attachmentPath={`seqdb-api/molecular-analysis-run/${sequencingRunId}/attachments`}
                      title={
                        <DinaMessage id="molecularAnalysisRunStep_attachments" />
                      }
                    />
                  )}
                </>
              )}
            </DinaForm>
          </div>
        </div>
      ) : (
        <div className="row">
          <div className="col-12">
            <Alert variant="info" className="mb-0">
              <DinaMessage id="sangerRunStep_noRunExists" />
            </Alert>
          </div>
        </div>
      )}
    </>
  );
}
