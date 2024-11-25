import { useQuery } from "common-ui";
import { MetagenomicsBatch } from "../../../types/seqdb-api/resources/metagenomics/MetagenomicsBatch";

export function useMetagenomicsBatchQuery(id?: string, deps?: any[]) {
  return useQuery<MetagenomicsBatch>(
    {
      path: `seqdb-api/metagenomics-batch/${id}`,
      include: "protocol,indexSet"
    },
    { disabled: !id, deps }
  );
}
