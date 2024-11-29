import { useQuery } from "common-ui";
import { GenericMolecularAnalysis } from "packages/dina-ui/types/seqdb-api/resources/GenericMolecularAnalysis";

export function useMolecularAnalysisQuery(id?: string, deps?: any[]) {
  return useQuery<GenericMolecularAnalysis>(
    {
      path: `seqdb-api/generic-molecular-analysis/${id}`,
      include: "protocol"
    },
    { disabled: !id, deps }
  );
}
