import { SubmitButton } from "common-ui";
import { PersistedResource } from "kitsu";
import { LibraryPrepBatchForm } from "../../../pages/seqdb/library-prep-batch/edit";
import { useEffect } from "react";
import { LibraryPrepBatch } from "../../../types/seqdb-api";

export interface LibraryPrepBatchStepProps {
  batchId?: string;
  batch?: LibraryPrepBatch;
  onSaved: (
    nextStep: number,
    batchSaved?: PersistedResource<LibraryPrepBatch>
  ) => Promise<void>;
  editMode: boolean;
  setEditMode: (newValue: boolean) => void;
  performSave: boolean;
  setPerformSave: (newValue: boolean) => void;
}

export function LibraryPrepBatchStep({
  batchId,
  batch,
  onSaved,
  editMode,
  setEditMode,
  performSave,
  setPerformSave
}: LibraryPrepBatchStepProps) {
  useEffect(() => {
    if (!batchId) {
      setEditMode(true);
    }
  }, [batchId]);

  async function onSavedInternal(
    resource: PersistedResource<LibraryPrepBatch>
  ) {
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
    <LibraryPrepBatchForm
      libraryPrepBatch={batch as any}
      onSaved={onSavedInternal}
      buttonBar={buttonBar}
      readOnlyOverride={!editMode}
    />
  );
}
