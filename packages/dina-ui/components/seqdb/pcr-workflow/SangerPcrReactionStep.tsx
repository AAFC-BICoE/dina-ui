import { DinaForm, LoadingSpinner, Operation, useApiClient } from "common-ui";
import { FormikProps } from "formik";
import { Ref, useEffect, useRef } from "react";
import { PcrBatch, PcrBatchItem } from "../../../types/seqdb-api";
import { PcrReactionTable, usePcrReactionData } from "./PcrReactionTable";
import Link from "next/link";
import { AttachmentsField } from "../../object-store/attachment-list/AttachmentsField";
import { DinaMessage } from "../../../intl/dina-ui-intl";
import { InputResource, PersistedResource } from "kitsu";

export interface SangerPcrReactionProps {
  pcrBatchId: string;
  pcrBatch: PcrBatch;
  editMode: boolean;
  performSave: boolean;
  setPerformSave: (newValue: boolean) => void;
  performComplete: boolean;
  setPerformComplete: (newValue: boolean) => void;
  setEditMode: (newValue: boolean) => void;
  setReloadPcrBatch: (newValue: number) => void;
  onSaved?: (
    nextStep: number,
    pcrBatchSaved?: PersistedResource<PcrBatch>
  ) => Promise<void>;
}

export function SangerPcrReactionStep({
  pcrBatchId,
  pcrBatch,
  editMode,
  performSave,
  setPerformSave,
  performComplete,
  setPerformComplete,
  setEditMode,
  setReloadPcrBatch,
  onSaved
}: SangerPcrReactionProps) {
  const { doOperations, save } = useApiClient();
  const formRef: Ref<FormikProps<Partial<PcrBatchItem>>> = useRef(null);
  const { loading, materialSamples, pcrBatchItems, setPcrBatchItems } =
    usePcrReactionData(pcrBatchId);

  // Check if a save was requested from the top level button bar.
  useEffect(() => {
    if ((performComplete || performSave) && !!pcrBatchId) {
      performSaveInternal();
      setEditMode(false);
    }
  }, [performSave, performComplete]);

  async function performSaveInternal() {
    if (formRef && (formRef as any)?.current?.values?.results) {
      const results = (formRef as any)?.current.values.results;

      const resultsWithId = Object.keys(results).map((id) => ({
        id,
        value: results[id]
      }));
      if (resultsWithId.length > 0) {
        // Using the results, generate the operations.
        const operations = resultsWithId.map<Operation>((result) => ({
          op: "PATCH",
          path: "pcr-batch-item/" + result.id,
          value: {
            id: result.id,
            type: "pcr-batch-item",
            attributes: {
              result: result.value
            }
          }
        }));

        const savedResult = await doOperations(operations, {
          apiBaseUrl: "/seqdb-api"
        });
        const newItems = [...pcrBatchItems];
        for (const rst of savedResult) {
          const id = rst.data["id"];
          const result = rst.data["attributes"].result;
          const found = newItems.find((itm) => itm.id === id);
          if (found) {
            found.result = result;
          }
        }
        setPcrBatchItems(newItems);
      }
    }

    if (performComplete || (formRef as any)?.current?.values?.attachment) {
      const resourceInput: InputResource<PcrBatch> = {
        id: pcrBatchId,
        isCompleted: performComplete ? true : pcrBatch.isCompleted,
        type: "pcr-batch"
      };
      (resourceInput as any).relationships = {};

      // Check if an attachment needs to be included as a relationship.
      (resourceInput as any).relationships.attachment = {
        data:
          (formRef as any)?.current?.values?.attachment?.map?.((it) => ({
            id: it.id,
            type: it.type
          })) ?? []
      };

      await save<PcrBatch>(
        [
          {
            resource: resourceInput as any,
            type: "pcr-batch"
          }
        ],
        {
          apiBaseUrl: "/seqdb-api"
        }
      );

      // Reload the current PCR Batch.
      setReloadPcrBatch(Date.now());
    }

    // Leave edit mode...
    if (!!setPerformSave) {
      setPerformSave(false);
    }

    if (!!setPerformComplete) {
      setPerformComplete(false);
    }
    await onSaved?.(4);
  }

  // Load the result based on the API request with the pcr-batch-item.
  const initialValues = {
    results: Object.fromEntries(
      pcrBatchItems.map((obj) => [obj.id, obj.result])
    ),
    attachment: pcrBatch.attachment
  };

  if (loading) {
    return <LoadingSpinner loading={true} />;
  }

  return (
    <DinaForm<Partial<PcrBatchItem>>
      initialValues={initialValues as any}
      innerRef={formRef}
      readOnly={!editMode}
    >
      {!editMode && (
        <div className="row mb-3">
          <div className="col-12 text-end">
            <Link
              href={`/seqdb/pcr-workflow/worksheet?id=${pcrBatchId}`}
              target="_blank"
              className="btn btn-primary"
            >
              Worksheet
            </Link>
          </div>
        </div>
      )}
      <PcrReactionTable
        pcrBatchItems={pcrBatchItems}
        materialSamples={materialSamples}
      />
      <AttachmentsField
        name="attachment"
        title={<DinaMessage id="pcrBatchAttachments" />}
        attachmentPath={`seqdb-api/pcr-batch/${pcrBatchId}/attachment`}
        id="pcr-batch-attachments"
        hideAddAttchmentBtn={true}
      />
    </DinaForm>
  );
}
