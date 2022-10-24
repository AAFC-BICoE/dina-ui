import { DinaForm, SubmitButton, withResponse } from "common-ui";
import { PersistedResource } from "kitsu";
import {
  PcrBatchForm,
  PcrBatchFormFields,
  usePcrBatchQuery
} from "../../../pages/seqdb/pcr-batch/edit";
import { PcrBatch } from "../../../types/seqdb-api";

export interface SangerPcrBatchStepProps {
  pcrBatchId?: string;
  onSaved: (resource: PersistedResource<PcrBatch>) => Promise<void>;
  editMode: boolean;
  setEditMode: (newValue: boolean) => void;
  performSave: boolean;
  setPerformSave: (newValue: boolean) => void;
}

export function SangerPcrBatchStep({
  pcrBatchId,
  onSaved,
  editMode,
  setEditMode,
  performSave,
  setPerformSave
}: SangerPcrBatchStepProps) {
  const pcrBatchQuery = usePcrBatchQuery(pcrBatchId, [editMode]);

  async function onSavedInternal(resource: PersistedResource<PcrBatch>) {
    await onSaved(resource);
    setPerformSave(false);
  }

  return pcrBatchId ? (
    withResponse(pcrBatchQuery, ({ data: pcrBatch }) =>
      editMode ? (
        <PcrBatchForm
          pcrBatch={pcrBatch}
          onSaved={onSavedInternal}
          buttonBar={
            <div>
              <SubmitButton className="hidden" performSave={performSave} />
            </div>
          }
        />
      ) : (
        <DinaForm<PcrBatch> initialValues={pcrBatch} readOnly={true}>
          <PcrBatchFormFields />
        </DinaForm>
      )
    )
  ) : (
    <PcrBatchForm onSaved={onSavedInternal} />
  );
}
