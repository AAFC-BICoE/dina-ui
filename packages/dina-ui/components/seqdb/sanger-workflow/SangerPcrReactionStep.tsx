import { PersistedResource } from "kitsu";
import { PcrBatchForm } from "../../../pages/seqdb/pcr-batch/edit";
import { PcrBatch } from "../../../types/seqdb-api";
import { useEffect } from "react";
import { SubmitButton } from "common-ui";

export interface SangerPcrReactionProps {
  pcrBatchId?: string;
  pcrBatch?: PcrBatch;
  onSaved: (resource: PersistedResource<PcrBatch>) => Promise<void>;
  editMode: boolean;
  setEditMode: (newValue: boolean) => void;
  performSave: boolean;
  setPerformSave: (newValue: boolean) => void;
}

export function SangerPcrReactionStep({
  pcrBatchId,
  pcrBatch,
  onSaved,
  editMode,
  setEditMode,
  performSave,
  setPerformSave
}: SangerPcrReactionProps) {
  // If no PCR Batch has been created, automatically go to edit mode.
  useEffect(() => {
    if (!pcrBatchId) {
      setEditMode(true);
    }
  }, [pcrBatchId]);

  async function onSavedInternal(resource: PersistedResource<PcrBatch>) {
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
    <PcrBatchForm
      pcrBatch={pcrBatch as any}
      onSaved={onSavedInternal}
      buttonBar={buttonBar}
      readOnlyOverride={!editMode}
    />
  );
}
