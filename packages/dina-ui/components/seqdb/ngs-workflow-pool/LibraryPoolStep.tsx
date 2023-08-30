import { SubmitButton } from "common-ui";
import { PersistedResource } from "kitsu";
import { useEffect } from "react";
import { LibraryPool2 } from "../../../types/seqdb-api";
import { LibraryPoolForm } from "../../../pages/seqdb/ngs-workflow-pooling/edit";

export interface LibraryPoolStepProps {
  libraryPoolId?: string;
  libraryPool?: LibraryPool2;
  onSaved: (
    nextStep: number,
    libraryPoolSaved?: PersistedResource<LibraryPool2>
  ) => Promise<void>;
  editMode: boolean;
  setEditMode: (newValue: boolean) => void;
  performSave: boolean;
  setPerformSave: (newValue: boolean) => void;
}

export function LibraryPoolStep({
  libraryPoolId,
  libraryPool,
  onSaved,
  editMode,
  setEditMode,
  performSave,
  setPerformSave
}: LibraryPoolStepProps) {
  useEffect(() => {
    if (!libraryPoolId) {
      setEditMode(true);
    }
  }, [libraryPoolId]);

  async function onSavedInternal(resource: PersistedResource<LibraryPool2>) {
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
    <LibraryPoolForm
      libraryPool={libraryPool as any}
      onSaved={onSavedInternal}
      buttonBar={buttonBar}
      readOnlyOverride={!editMode}
    />
  );
}
