import { SubmitButton } from "common-ui";
import { PersistedResource } from "kitsu";
import { SeqBatchForm } from "../../../pages/seqdb/seq-batch/edit";
import { SeqBatch } from "../../../types/seqdb-api";
import { useEffect } from "react";

export interface SangerSeqBatchStepProps {
  seqBatchId?: string;
  seqBatch?: SeqBatch;
  onSaved: (
    nextStep: number,
    pcrBatchSaved?: PersistedResource<SeqBatch>
  ) => Promise<void>;
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
    setPerformSave(false);
    await onSaved(1, resource);
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
