import { SubmitButton } from "common-ui";
import { PersistedResource } from "kitsu";
import { SeqBatchForm } from "../../../pages/seqdb/seq-batch/edit";
import { SeqBatch } from "../../../types/seqdb-api";
import { useEffect } from "react";

export interface SangerSeqBatchStepProps {
  seqBatchId?: string;
  seqBatch?: SeqBatch;
  onSaved: (resource: PersistedResource<SeqBatch>) => Promise<void>;
  editMode: boolean;
  setEditMode: (newValue: boolean) => void;
  performSave: boolean;
  setPerformSave: (newValue: boolean) => void;
}

export function SangerSeqBatchStep({
  seqBatchId,
  seqBatch,
  onSaved,
  editMode,
  setEditMode,
  performSave,
  setPerformSave
}: SangerSeqBatchStepProps) {
  // If no SEQ Batch has been created, automatically go to edit mode.
  useEffect(() => {
    if (!seqBatchId) {
      setEditMode(true);
    }
  }, [seqBatchId]);

  async function onSavedInternal(resource: PersistedResource<SeqBatch>) {
    await onSaved(resource);
    setEditMode(false);
  }

  const buttonBar = (
    <>
      <SubmitButton
        className="hidden"
        performSave={performSave}
        setPerformSave={setPerformSave}
      />
    </>
  );

  return (
    <SeqBatchForm
      seqBatch={seqBatch as any}
      onSaved={onSavedInternal}
      buttonBar={buttonBar}
      readOnlyOverride={!editMode}
    />
  );
}
