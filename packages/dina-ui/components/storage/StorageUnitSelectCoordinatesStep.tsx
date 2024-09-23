import { useEffect } from "react";

interface StorageUnitSelectCoordinatesStepProps {
  onSaved: (nextStep?: number) => Promise<void>;
  performSave: boolean;
}

export function StorageUnitSelectCoordinatesStep({
  onSaved,
  performSave
}: StorageUnitSelectCoordinatesStepProps) {
  useEffect(() => {
    async function performSaveInternal() {
      await onSaved();
    }

    if (performSave) {
      performSaveInternal();
    }
  }, [performSave]);
  return <div>Select Coordinates</div>;
}
