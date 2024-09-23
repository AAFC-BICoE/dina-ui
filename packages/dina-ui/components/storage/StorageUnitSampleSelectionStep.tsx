import { useEffect } from "react";

interface StorageUnitSampleSelectionStepProps {
  onSaved: (nextStep?: number) => Promise<void>;
  performSave: boolean;
}

export function StorageUnitSampleSelectionStep({
  onSaved,
  performSave
}: StorageUnitSampleSelectionStepProps) {
  useEffect(() => {
    async function performSaveInternal() {
      await onSaved(1);
    }

    if (performSave) {
      performSaveInternal();
    }
  }, [performSave]);

  return <div>Sample Selection</div>;
}
