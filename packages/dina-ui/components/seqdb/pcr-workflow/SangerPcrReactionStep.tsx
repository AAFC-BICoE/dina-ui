import { DinaForm, LoadingSpinner, Operation, useApiClient } from "common-ui";
import { FormikProps } from "formik";
import { Ref, useEffect, useRef } from "react";
import { PcrBatchItem } from "../../../types/seqdb-api";
import { PcrReactionTable, usePcrReactionData } from "./PcrReactionTable";

export interface SangerPcrReactionProps {
  pcrBatchId: string;
  editMode: boolean;
  performSave: boolean;
  setPerformSave?: (newValue: boolean) => void;
}

export function SangerPcrReactionStep({
  pcrBatchId,
  editMode,
  performSave,
  setPerformSave
}: SangerPcrReactionProps) {
  const { doOperations } = useApiClient();
  const formRef: Ref<FormikProps<Partial<PcrBatchItem>>> = useRef(null);
  const { loading, materialSamples, pcrBatchItems, setPcrBatchItems } =
    usePcrReactionData(pcrBatchId);

  // Check if a save was requested from the top level button bar.
  useEffect(() => {
    if (performSave && !!pcrBatchId) {
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

        const savedResult = await doOperations(operations, {
          apiBaseUrl: "/seqdb-api"
        });
        const newItems = [...pcrBatchItems];
        for (const rst of savedResult) {
          /* tslint:disable-next-line */
          const id = rst.data["id"];
          /* tslint:disable-next-line */
          const result = rst.data["attributes"].result;
          const found = newItems.find((itm) => itm.id === id);
          if (found) {
            found.result = result;
          }
        }
        setPcrBatchItems(newItems);
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
