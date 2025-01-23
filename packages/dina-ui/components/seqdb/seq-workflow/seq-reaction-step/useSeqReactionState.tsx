import { useApiClient } from "packages/common-ui/lib";
import { PcrBatchItem, SeqReaction } from "packages/dina-ui/types/seqdb-api";
import { useState, useEffect } from "react";
import { compact } from "lodash";
import { MaterialSample } from "packages/dina-ui/types/collection-api";
import { useLocalStorage } from "@rehooks/local-storage";
import { StorageUnitUsage } from "packages/dina-ui/types/collection-api/resources/StorageUnitUsage";

export function useSeqReactionState(seqBatchId?: string) {
  const [selectedResources, setSelectedResources] = useState<SeqReaction[]>([]);
  const [loadingSeqReactions, setLoadingSeqReactions] = useState<boolean>(true);
  const { apiClient, bulkGet } = useApiClient();
  // The map key is pcrBatchItem.id + "_" + seqPrimer.id
  // the map value is the real UUID from the database.
  const [
    previouslySelectedResourcesIDMap,
    setPreviouslySelectedResourcesIDMap
  ] = useState<{ [key: string]: string }>({} as { [key: string]: string });
  const [seqReactionSortOrder, setSeqReactionSortOrder] = useLocalStorage<
    string[]
  >(`seqReactionSortOrder-${seqBatchId}`);

  useEffect(() => {
    fetchSeqReactions();
  }, [seqBatchId]);

  // Sort Seq Reactions based on the preserved order in local storage
  function sortSeqReactions(reactions: SeqReaction[]) {
    if (seqReactionSortOrder) {
      const sorted = seqReactionSortOrder.map((reactionId) =>
        reactions.find((item) => {
          const tempId: (string | undefined)[] = [];
          tempId.push(item.pcrBatchItem?.id);
          tempId.push(item.seqPrimer?.id);
          const id = compact(tempId).join("_");
          return id === reactionId;
        })
      );
      reactions.forEach((item) => {
        const tempId: (string | undefined)[] = [];
        tempId.push(item.pcrBatchItem?.id);
        tempId.push(item.seqPrimer?.id);
        const id = compact(tempId).join("_");
        if (seqReactionSortOrder.indexOf(id) === -1) {
          sorted.push(item);
        }
      });
      return compact(sorted);
    } else {
      return compact(reactions);
    }
  }

  const fetchSeqReactions = async () => {
    const { data: seqReactions } = await apiClient.get<SeqReaction[]>(
      "/seqdb-api/seq-reaction",
      {
        filter: {
          "seqBatch.uuid": seqBatchId as string
        },
        include: [
          "pcrBatchItem",
          "seqPrimer",
          "storageUnitUsage",
          "molecularAnalysisRunItem",
          "molecularAnalysisRunItem.run"
        ].join(","),
        sort: "pcrBatchItem",
        page: { limit: 1000 }
      }
    );

    let pcrBatchItems = compact(
      await bulkGet<PcrBatchItem, true>(
        seqReactions?.map(
          (item) =>
            `/pcr-batch-item/${item.pcrBatchItem?.id}?include=materialSample,pcrBatch,storageUnitUsage`
        ),
        {
          apiBaseUrl: "/seqdb-api",
          returnNullForMissingResource: true
        }
      )
    );
    const pcrBatchStorageUnitUsages = compact(
      await bulkGet<StorageUnitUsage>(
        pcrBatchItems?.map(
          (item) => `/storage-unit-usage/${item.storageUnitUsage?.id}`
        ),
        {
          apiBaseUrl: "/collection-api",
          returnNullForMissingResource: true
        }
      )
    );
    pcrBatchItems = pcrBatchItems.map((pcrBatchItem) => ({
      ...pcrBatchItem,
      storageUnitUsage: pcrBatchStorageUnitUsages.find(
        (suc) => suc.id === pcrBatchItem.storageUnitUsage?.id
      )
    }));

    const materialSamples = compact(
      await bulkGet<MaterialSample, true>(
        pcrBatchItems?.map(
          (item) => `/material-sample-summary/${item.materialSample?.id}`
        ),
        {
          apiBaseUrl: "/collection-api",
          returnNullForMissingResource: true
        }
      )
    );

    const seqReactionStorageUnitUsages = compact(
      await bulkGet<StorageUnitUsage>(
        seqReactions?.map(
          (item) => `/storage-unit-usage/${item.storageUnitUsage?.id}`
        ),
        {
          apiBaseUrl: "/collection-api",
          returnNullForMissingResource: true
        }
      )
    );

    seqReactions.forEach((item) => {
      if (item.pcrBatchItem && item.pcrBatchItem?.id) {
        item.pcrBatchItem = pcrBatchItems.find(
          (pbi) => pbi.id === item.pcrBatchItem?.id
        );
        if (
          item.pcrBatchItem?.materialSample &&
          item.pcrBatchItem.materialSample.id
        ) {
          const foundSample = materialSamples.find(
            (sample) => sample.id === item.pcrBatchItem?.materialSample?.id
          );
          item.pcrBatchItem.materialSample = foundSample;
        }
      }

      // Link the seqReaction storage unit.
      if (item.storageUnitUsage?.id) {
        item.storageUnitUsage = seqReactionStorageUnitUsages.find(
          (storageUsage) => storageUsage.id === item.storageUnitUsage?.id
        );
      }

      return item;
    });

    setPreviouslySelectedResourcesIDMap(
      compact(seqReactions).reduce(
        (accu, obj) => ({
          ...accu,
          [`${obj.pcrBatchItem?.id}_${obj.seqPrimer?.id}`]: obj.id
        }),
        {} as { [key: string]: string }
      )
    );

    for (const item of seqReactions) {
      const tempId: (string | undefined)[] = [];
      tempId.push(item.pcrBatchItem?.id);
      tempId.push(item.seqPrimer?.id);
      item.id = compact(tempId).join("_");
    }
    const sorted = sortSeqReactions(seqReactions);
    setSelectedResources(sorted);
    setLoadingSeqReactions(false);
  };

  return {
    selectedResources,
    setSelectedResources,
    previouslySelectedResourcesIDMap,
    setPreviouslySelectedResourcesIDMap,
    seqReactionSortOrder,
    setSeqReactionSortOrder,
    loadingSeqReactions
  };
}
