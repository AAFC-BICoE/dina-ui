import { DeleteArgs, useApiClient } from "packages/common-ui/lib";
import { useState } from "react";

/**
 * Handles deleting molecular analysis workflows and unlinking and deleting any associated relationship resources
 * @param resourceIds Molecular Analysis Workflow uuids to be deleted
 */
export function useDeleteMolecularAnalysisWorkflows() {
  const { save } = useApiClient();
  // Used to determine if the resource needs to be reloaded.
  const [reloadResource, setReloadResource] = useState<number>(Date.now());

  async function handleDeleteMolecularAnalysisWorkflows(resourceIds: string[]) {
    const molecularAnlysisDeleteArgs: DeleteArgs[] = resourceIds.map(
      (resourceId) => ({
        delete: {
          id: resourceId,
          type: "generic-molecular-analysis"
        }
      })
    );

    // Can delete workflow with protocol linked
    await save(molecularAnlysisDeleteArgs, {
      apiBaseUrl: `/seqdb-api/generic-molecular-analysis/`
    });
    setReloadResource(Date.now());
  }

  return {
    handleDeleteMolecularAnalysisWorkflows,
    reloadResource
  };
}
