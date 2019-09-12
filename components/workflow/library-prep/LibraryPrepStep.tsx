import { useState } from "react";
import { LoadingSpinner, useQuery } from "../..";
import { StepResource } from "../../../types/seqdb-api";
import { StepRendererProps } from "../StepRenderer";
import { LibraryPrepBatchDetails } from "./LibraryPrepBatchDetails";
import { LibraryPrepBatchForm } from "./LibraryPrepBatchForm";
import { SampleToIndexTable } from "./SampleToIndexTable";

export function LibraryPrepStep(props: StepRendererProps) {
  const { chain, chainStepTemplates, step } = props;

  const sampleSelectionStep =
    chainStepTemplates[chainStepTemplates.indexOf(step) - 2];

  const [lastSave, setLastSave] = useState(Date.now());
  const [editBatchDetails, setEditBatchDetails] = useState(false);

  const { loading, response } = useQuery<StepResource[]>(
    {
      filter: {
        "chain.chainId": chain.id,
        "chainStepTemplate.chainStepTemplateId": step.id
      },
      include:
        "libraryPrepBatch,libraryPrepBatch.product,libraryPrepBatch.protocol",
      path: "stepResource"
    },
    {
      deps: [lastSave]
    }
  );

  if (loading) {
    return <LoadingSpinner loading={true} />;
  }

  if (
    response &&
    (!response.data.length || (response.data && editBatchDetails))
  ) {
    return (
      <LibraryPrepBatchForm
        chain={chain}
        libraryPrepBatch={
          response.data.length ? response.data[0].libraryPrepBatch : undefined
        }
        step={step}
        onSuccess={() => {
          setEditBatchDetails(false);
          setLastSave(Date.now());
        }}
      />
    );
  }

  if (response && response.data.length) {
    const libraryPrepBatch = response.data[0].libraryPrepBatch;

    return (
      <>
        <h2>Library Batch Prep</h2>
        <button
          className="btn btn-primary float-right"
          onClick={() => setEditBatchDetails(true)}
          type="button"
        >
          Edit Batch Details
        </button>
        <div className="form-group">
          <LibraryPrepBatchDetails libraryPrepBatch={libraryPrepBatch} />
        </div>
        <div className="form-group">
          <SampleToIndexTable
            chain={chain}
            libraryPrepBatch={libraryPrepBatch}
            sampleSelectionStep={sampleSelectionStep}
          />
        </div>
      </>
    );
  }

  return null;
}
