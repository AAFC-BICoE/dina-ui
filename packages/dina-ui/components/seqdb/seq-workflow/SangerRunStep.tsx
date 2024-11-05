import Link from "next/link";
import { SeqBatch } from "packages/dina-ui/types/seqdb-api";
import { useMolecularAnalysisRun } from "./useMolecularAnalysisRun";
import { LoadingSpinner } from "common-ui";
import { Alert } from "react-bootstrap";

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
  performSave
}: SangerRunStepProps) {
  const {
    loading,
    multipleRunWarning,
    setSequencingRunName,
    sequencingRunName
  } = useMolecularAnalysisRun({
    editMode,
    performSave,
    seqBatchId
  });

  // Display loading if network requests from hook are still loading in...
  if (loading) {
    return (
      <div
        className="d-flex align-items-center justify-content-center"
        style={{ marginTop: "calc(50vh - 10px)" }}
      >
        <LoadingSpinner loading={true} />
      </div>
    );
  }

  return (
    <>
      {/* Worksheet Buttton */}
      {!editMode && (
        <div className="row">
          <div className="col-12 text-end">
            <Link href={`/seqdb/seq-workflow/worksheet?id=${seqBatchId}`}>
              <a target="_blank" className="btn btn-primary">
                Worksheet
              </a>
            </Link>
          </div>
        </div>
      )}

      {/* Multiple Runs Exist Warning */}
      {multipleRunWarning && (
        <div className="row">
          <Alert variant="warning" className="mb-0">
            <Alert.Heading>Multiple runs exist for this SeqBatch</Alert.Heading>
            <p>Only one run should exist per SeqBatch.</p>
          </Alert>
        </div>
      )}

      {/* Run Information */}
      <div className="row">
        <div className="col-4">
          <strong>Sequencing Run:</strong>
          <input
            className="form-control"
            name="sequencingRunName"
            value={sequencingRunName}
            onChange={(newValue) =>
              setSequencingRunName(newValue.target.value ?? "")
            }
          />
        </div>
        <div className="col-12">
          <strong>Sequencing Run Content:</strong>
        </div>
      </div>
    </>
  );
}
