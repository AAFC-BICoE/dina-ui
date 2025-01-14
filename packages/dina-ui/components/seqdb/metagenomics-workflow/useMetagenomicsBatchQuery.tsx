import { filterBy, useApiClient, useQuery } from "common-ui";
import { MetagenomicsBatch } from "../../../types/seqdb-api/resources/metagenomics/MetagenomicsBatch";
import { PcrBatchItem } from "../../../types/seqdb-api";
import { MetagenomicsBatchItem } from "../../../types/seqdb-api/resources/metagenomics/MetagenomicsBatchItem";
import { PersistedResource } from "kitsu";
import { useEffect } from "react";

export function useMetagenomicsBatchQuery(
  metagenomicsBatchId?: string,
  pcrBatchId?: string,
  setMetagenomicsBatchId?: React.Dispatch<
    React.SetStateAction<string | undefined>
  >,
  deps?: any[]
) {
  const { apiClient } = useApiClient();
  /**
   * Retrieve all of the PCR Batch Items that are associated with the PCR Batch from step 1.
   */
  async function fetchPcrBatchItems() {
    const pcrBatchItemsResp = await apiClient.get<PcrBatchItem[]>(
      "/seqdb-api/pcr-batch-item",
      {
        filter: filterBy([], {
          extraFilters: [
            {
              selector: "pcrBatch.uuid",
              comparison: "==",
              arguments: pcrBatchId!
            }
          ]
        })("")
      }
    );
    return pcrBatchItemsResp.data;
  }

  async function getMetagenomicsBatchId(
    pcrBatchItems: PersistedResource<PcrBatchItem>[]
  ) {
    const metagenomicsBatchItem = await apiClient.get<MetagenomicsBatchItem[]>(
      "/seqdb-api/metagenomics-batch-item",
      {
        include: "metagenomicsBatch",
        filter: filterBy([], {
          extraFilters: [
            {
              selector: "pcrBatchItem.uuid",
              comparison: "==",
              arguments: pcrBatchItems[0].id!
            }
          ]
        })("")
      }
    );
    return metagenomicsBatchItem?.data?.[0]?.metagenomicsBatch?.id;
  }
  async function fetchMetagenomicsBatch() {
    const pcrBatchItems = await fetchPcrBatchItems();

    // Only reverse look up metagenomicsBatch if pcrBatchItems exist
    if (pcrBatchItems?.length > 0) {
      const fetchedMetagenomicsBatchId = await getMetagenomicsBatchId(
        pcrBatchItems
      );
      setMetagenomicsBatchId?.(fetchedMetagenomicsBatchId);
    }
  }
  useEffect(() => {
    if (!metagenomicsBatchId) {
      if (pcrBatchId) {
        fetchMetagenomicsBatch();
      }
    }
  }, [metagenomicsBatchId]);

  const metagenomicsBatch = useQuery<MetagenomicsBatch>(
    {
      path: `seqdb-api/metagenomics-batch/${metagenomicsBatchId}`,
      include: "protocol,indexSet"
    },
    {
      disabled: !metagenomicsBatchId,
      deps
    }
  );
  return metagenomicsBatch;
}
