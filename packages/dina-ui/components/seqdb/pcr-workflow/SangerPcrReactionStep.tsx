import { DinaForm, LoadingSpinner, Operation, useApiClient } from "common-ui";
import { FormikProps } from "formik";
import { Ref, useEffect, useRef } from "react";
import { PcrBatchItem } from "../../../types/seqdb-api";
import { PcrReactionTable, usePcrReactionData } from "./PcrReactionTable";
import { useRouter } from "next/router";

export interface SangerPcrReactionProps {
  pcrBatchId: string;
  editMode: boolean;
  setEditMode?: (newValue: boolean) => void;
  performSave: boolean;
  setPerformSave?: (newValue: boolean) => void;
}

export function SangerPcrReactionStep({
  pcrBatchId,
  editMode,
  setEditMode,
  performSave,
  setPerformSave
}: SangerPcrReactionProps) {
  const { doOperations } = useApiClient();
  const formRef: Ref<FormikProps<Partial<PcrBatchItem>>> = useRef(null);
  const { loading, materialSamples, pcrBatchItems } =
    usePcrReactionData(pcrBatchId);
  const router = useRouter();
  const thisStep = router.query.step ? Number(router.query.step) : 0;

  // Check if a save was requested from the top level button bar.
  useEffect(() => {
    if (performSave && !!pcrBatchId && thisStep === 3) {
      performSaveInternal();
    }
  }, [performSave]);

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

        await doOperations(operations, { apiBaseUrl: "/seqdb-api" });
        setEditMode?.(false);
      }
    }

    // Leave edit mode...
    if (!!setPerformSave) {
      setPerformSave(false);
    }
  }

  // Load the result based on the API request with the pcr-batch-item.
  const initialValues = {
    results: Object.fromEntries(
      pcrBatchItems.map((obj) => [obj.id, obj.result])
    )
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
      <PcrReactionTable
        pcrBatchItems={pcrBatchItems}
        materialSamples={materialSamples}
      />
    </DinaForm>
  );
}
