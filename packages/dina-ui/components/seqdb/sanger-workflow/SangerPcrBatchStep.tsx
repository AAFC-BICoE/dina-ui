import { ButtonBar, DinaForm, SubmitButton, withResponse } from "common-ui";
import { PersistedResource } from "kitsu";
import { useState } from "react";
import { SeqdbMessage } from "../../../intl/seqdb-intl";
import {
  LoadExternalDataForPcrBatchForm,
  PcrBatchForm,
  PcrBatchFormFields,
  usePcrBatchQuery
} from "../../../pages/seqdb/pcr-batch/edit";
import { PcrBatch } from "../../../types/seqdb-api";

export interface SangerPcrBatchStepProps {
  pcrBatchId?: string;
  onSaved: (resource: PersistedResource<PcrBatch>) => Promise<void>;
}

export function SangerPcrBatchStep({
  pcrBatchId,
  onSaved
}: SangerPcrBatchStepProps) {
  const [editMode, setEditMode] = useState(!pcrBatchId);

  const pcrBatchQuery = usePcrBatchQuery(pcrBatchId, [editMode]);

  async function onSavedInternal(resource: PersistedResource<PcrBatch>) {
    await onSaved(resource);
    setEditMode(false);
  }

  return pcrBatchId ? (
    withResponse(pcrBatchQuery, ({ data: pcrBatch }) =>
      editMode ? (
        <PcrBatchForm
          pcrBatch={pcrBatch}
          onSaved={onSavedInternal}
          buttonBar={
            <ButtonBar>
              <button
                className="btn btn-dark"
                type="button"
                onClick={() => setEditMode(false)}
                style={{ width: "10rem" }}
              >
                <SeqdbMessage id="cancelButtonText" />
              </button>
              <SubmitButton className="ms-auto" />
            </ButtonBar>
          }
        />
      ) : (
        <DinaForm<PcrBatch> initialValues={pcrBatch} readOnly={true}>
          <ButtonBar>
            <button
              className="btn btn-primary edit-button"
              type="button"
              onClick={() => setEditMode(true)}
              style={{ width: "10rem" }}
            >
              <SeqdbMessage id="editButtonText" />
            </button>
          </ButtonBar>
          <LoadExternalDataForPcrBatchForm
            dinaFormProps={{ initialValues: pcrBatch, readOnly: true }}
          />
        </DinaForm>
      )
    )
  ) : (
    <PcrBatchForm onSaved={onSavedInternal} />
  );
}
