import { LoadingSpinner } from "common-ui";
import { noop } from "lodash";
import Link from "next/link";
import { SeqBatch } from "packages/dina-ui/types/seqdb-api";
import { useEffect } from "react";
import {
  SeqReactionSample,
  useSeqSelectCoordinatesControls
} from "./seq-batch-select-coordinats-step/useSeqSelectCoordinatesControls";
import { DraggableItemList } from "../container-grid/DraggableItemList";
import { ContainerGrid } from "../container-grid/ContainerGrid";

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
  // seqBatch,
  // onSaved,
  editMode
}: // setEditMode,
// performSave,
// setPerformSave
SangerRunStepProps) {
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
    </>
  );
}
