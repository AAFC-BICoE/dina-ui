import { LoadingSpinner, useQuery } from "common-ui";
import { useState } from "react";
import { StepResource } from "../../../../types/seqdb-api";
import { StepRendererProps } from "../StepRenderer";
import { LibraryPoolDetails } from "./LibraryPoolDetails";
import { LibraryPoolDetailsForm } from "./LibraryPoolDetailsForm";
import { LibraryPoolingSelection } from "./LibraryPoolingSelection";

export function LibraryPoolingStep(props: StepRendererProps) {
  const { chain, step } = props;

  const [lastSave, setLastSave] = useState(Date.now());
  const [editPoolDetails, setEditPoolDetails] = useState(false);

  // Fetch this step's library pool:
  const { loading, response } = useQuery<StepResource[]>(
    {
      filter: {
        "chain.uuid": chain.id as string,
        "chainStepTemplate.uuid": step.id as string
      },
      include: "libraryPool",
      path: "seqdb-api/stepResource"
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
    (!response.data.length || (response.data && editPoolDetails))
  ) {
    return (
      <LibraryPoolDetailsForm
        chain={chain}
        libraryPool={
          response.data.length ? response.data[0].libraryPool : undefined
        }
        step={step}
        onSuccess={() => {
          setEditPoolDetails(false);
          setLastSave(Date.now());
        }}
      />
    );
  }

  const libraryPool =
    response && response.data[0] && response.data[0].libraryPool;

  if (libraryPool) {
    return (
      <>
        <h2>Library Pool Details</h2>
        <button
          className="btn btn-primary float-right"
          onClick={() => setEditPoolDetails(true)}
          type="button"
        >
          Edit Library Pool Details
        </button>
        <LibraryPoolDetails libraryPool={libraryPool} />
        <LibraryPoolingSelection libraryPool={libraryPool} />
      </>
    );
  }

  return null;
}
