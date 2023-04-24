import { SubmitButton } from "common-ui";
import { PersistedResource } from "kitsu";
import { PcrBatchForm } from "../../../pages/seqdb/pcr-batch/edit";
import { PcrBatch } from "../../../types/seqdb-api";
import { useEffect } from "react";

export interface SangerPcrBatchStepProps {
  pcrBatchId?: string;
  pcrBatch?: PcrBatch;
  onSaved: (
    nextStep: number,
    pcrBatchSaved?: PersistedResource<PcrBatch>
  ) => Promise<void>;
  editMode: boolean;
  setEditMode: (newValue: boolean) => void;
  performSave: boolean;
  setPerformSave: (newValue: boolean) => void;
}

export function SangerPcrBatchStep({
  pcrBatchId,
  pcrBatch,
  onSaved,
  editMode,
  setEditMode,
  performSave,
  setPerformSave
}: SangerPcrBatchStepProps) {
  // If no PCR Batch has been created, automatically go to edit mode.
  useEffect(() => {
    if (!pcrBatchId) {
      setEditMode(true);
    }
  }, [pcrBatchId]);

  async function onSavedInternal(resource: PersistedResource<PcrBatch>) {
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
    <PcrBatchForm
      pcrBatch={pcrBatch as any}
      onSaved={onSavedInternal}
      buttonBar={buttonBar}
      readOnlyOverride={!editMode}
    />
  );
}
