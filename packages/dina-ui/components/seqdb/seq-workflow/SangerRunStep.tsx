import Link from "next/link";
import { SeqBatch } from "packages/dina-ui/types/seqdb-api";
import { useEffect, useState } from "react";

export interface SangerRunStepProps {
  seqBatchId: string;
  seqBatch: SeqBatch;
  editMode: boolean;
  setEditMode: (newValue: boolean) => void;
  performSave: boolean;
  setPerformSave: (newValue: boolean) => void;
}

export function SangerRunStep({ seqBatchId, editMode }: SangerRunStepProps) {
  const [sequencingRunName, setSequencingRunName] = useState<string>();

  return (
    <>
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
