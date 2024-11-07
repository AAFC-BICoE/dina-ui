import { PcrBatchItem, SeqReaction } from "packages/dina-ui/types/seqdb-api";
import { MolecularAnalysisRunItem } from "packages/dina-ui/types/seqdb-api/resources/MolecularAnalysisRunItem";
import { useEffect, useState } from "react";
import { filterBy, useApiClient, useQuery } from "common-ui";
import { StorageUnitUsage } from "packages/dina-ui/types/collection-api/resources/StorageUnitUsage";
import { MolecularAnalysisRun } from "packages/dina-ui/types/seqdb-api/resources/MolecularAnalysisRun";
import { PersistedResource } from "kitsu";
import { MaterialSampleSummary } from "packages/dina-ui/types/collection-api";

export interface UseMolecularAnalysisRunProps {
  seqBatchId: string;
  editMode: boolean;
  setEditMode: (newValue: boolean) => void;
  performSave: boolean;
  setPerformSave: (newValue: boolean) => void;
}

/**
 * Represents data to be displayed in the table.
 */
export interface SequencingRunItem {
  seqReaction?: SeqReaction;
  seqReactionId?: string;

  storageUnitUsage?: StorageUnitUsage;
  storageUnitUsageId?: string;

  molecularAnalysisRunItem?: MolecularAnalysisRunItem;
  molecularAnalysisRunItemId?: string;

  pcrBatchItem?: PcrBatchItem;
  pcrBatchItemId?: string;

  materialSampleSummary?: MaterialSampleSummary;
  materialSampleId?: string;
}

export interface UseMolecularAnalysisRunReturn {
  /**
   * Used to display if the network calls are still in progress.
   */
  loading: boolean;

  /**
   * Only 1 MolecularAnalysisRun should be present for each SeqBatch, if multiple are found this
   * will return true and a warning can be displayed in the UI.
   */
  multipleRunWarning: boolean;

  /**
   * If a sequencing run exists, a name will be returned. Otherwise it will be undefined if not
   * created yet.
   */
  sequencingRunName?: string;

  /**
   * Locally sets the sequencing run name. Changing this does not automatically update the run
   * name. Once a save is performed, then it's saved/created.
   *
   * @param newName New name to use.
   */
  setSequencingRunName: (newName: string) => void;

  /**
   * Once all the data is loaded in, the contents will be returned to be displayed in the table.
   *
   * Undefined if no data is available yet.
   */
  sequencingRunItems?: SequencingRunItem[];
}

export function useMolecularAnalysisRun({
  seqBatchId,
  editMode,
  setEditMode,
  performSave,
  setPerformSave
}: UseMolecularAnalysisRunProps): UseMolecularAnalysisRunReturn {
  const { bulkGet, apiClient } = useApiClient();

  // Used to display if the network calls are still in progress.
  const [loading, setLoading] = useState<boolean>(true);
  const [multipleRunWarning, setMultipleRunWarning] = useState<boolean>(false);
  const [sequencingRunName, setSequencingRunName] = useState<string>();

  // Sequencing run, contains the name.
  const [sequencingRun, setSequencingRun] = useState<MolecularAnalysisRun>();

  // Run Items
  const [sequencingRunItems, setSequencingRunItems] =
    useState<SequencingRunItem[]>();

  // Network Requests, starting with the SeqReaction
  useQuery<SeqReaction[]>(
    {
      filter: filterBy([], {
        extraFilters: [
          {
            selector: "seqBatch.uuid",
            comparison: "==",
            arguments: seqBatchId
          }
        ]
      })(""),
      page: { limit: 1000 },
      path: `/seqdb-api/seq-reaction`,
      include: "storageUnitUsage,molecularAnalysisRunItem,pcrBatchItem"
    },
    {
      onSuccess: async ({ data: seqReactions }) => {
        /**
         * Takes an array of SeqReactions, then turns it into the SequencingRunItem which will be
         * used to generate more data.
         * @param seqReaction
         * @returns The initial structure of SequencingRunItem.
         */
        function attachSeqReaction(
          seqReaction: PersistedResource<SeqReaction>[]
        ): SequencingRunItem[] {
          return seqReaction.map<SequencingRunItem>((reaction) => ({
            seqReaction: reaction,
            molecularAnalysisRunItemId: (reaction as any)?.relationships
              ?.molecularAnalysisRunItem?.data?.id,
            storageUnitUsageId: (reaction as any)?.relationships
              ?.storageUnitUsage?.data?.id,
            pcrBatchItemId: (reaction as any)?.relationships?.pcrBatchItem?.data
              ?.id
          }));
        }

        async function attachMolecularAnalyisRunItem(
          sequencingRunItem: SequencingRunItem[]
        ): Promise<SequencingRunItem[]> {
          const molecularAnalyisRunItemQuery =
            await bulkGet<MolecularAnalysisRunItem>(
              sequencingRunItem
                .filter((item) => item?.molecularAnalysisRunItemId)
                .map(
                  (item) =>
                    "/molecular-analysis-run-item/" +
                    item?.molecularAnalysisRunItemId +
                    "?include=molecularAnalysisRun"
                ),
              { apiBaseUrl: "/seqdb-api" }
            );

          return sequencingRunItem.map((runItem) => {
            const queryStorageUnitUsage = molecularAnalyisRunItemQuery.find(
              (molecularRunItem) =>
                molecularRunItem?.id === runItem?.molecularAnalysisRunItemId
            );

            return {
              ...runItem,
              molecularAnalysisRunItem:
                queryStorageUnitUsage as MolecularAnalysisRunItem
            };
          });
        }

        /**
         * Fetch StorageUnitUsage linked to each SeqReactions. This will perform the API request
         * to retrieve the full storage unit since it's stored in the collection-api.
         * @returns The updated SeqReactionSample with storage unit attached.
         */
        async function attachStorageUnitUsage(
          sequencingRunItem: SequencingRunItem[]
        ): Promise<SequencingRunItem[]> {
          const storageUnitUsageQuery = await bulkGet<StorageUnitUsage>(
            sequencingRunItem
              .filter((item) => item?.storageUnitUsageId)
              .map((item) => "/storage-unit-usage/" + item?.storageUnitUsageId),
            { apiBaseUrl: "/collection-api" }
          );

          return sequencingRunItem.map((runItem) => {
            const queryStorageUnitUsage = storageUnitUsageQuery.find(
              (storageUnitUsage) =>
                storageUnitUsage?.id === runItem?.storageUnitUsageId
            );
            return {
              ...runItem,
              storageUnitUsage: queryStorageUnitUsage as StorageUnitUsage
            };
          });
        }

        /**
         * Fetch PcrBatchItem linked to each SeqReactions.
         */
        async function attachPcrBatchItem(
          sequencingRunItem: SequencingRunItem[]
        ): Promise<SequencingRunItem[]> {
          const pcrBatchItemQuery = await bulkGet<PcrBatchItem>(
            sequencingRunItem
              .filter((item) => item?.pcrBatchItemId)
              .map(
                (item) =>
                  "/pcr-batch-item/" +
                  item?.pcrBatchItemId +
                  "?include=materialSample"
              ),
            { apiBaseUrl: "/seqdb-api" }
          );

          return sequencingRunItem.map((runItem) => {
            const queryPcrBatchItem = pcrBatchItemQuery.find(
              (pcrBatchItem) => pcrBatchItem?.id === runItem?.pcrBatchItemId
            );
            return {
              ...runItem,
              pcrBatchItem: queryPcrBatchItem as PcrBatchItem,
              materialSampleId: queryPcrBatchItem?.materialSample?.id
            };
          });
        }

        /**
         * Fetch MaterialSampleSummary from each PcrBatchItem.
         */
        async function attachMaterialSampleSummary(
          sequencingRunItem: SequencingRunItem[]
        ): Promise<SequencingRunItem[]> {
          const materialSampleSummaryQuery =
            await bulkGet<MaterialSampleSummary>(
              sequencingRunItem
                .filter((item) => item?.materialSampleId)
                .map(
                  (item) => "/material-sample-summary/" + item?.materialSampleId
                ),
              { apiBaseUrl: "/collection-api" }
            );

          return sequencingRunItem.map((runItem) => {
            const queryMaterialSampleSummary = materialSampleSummaryQuery.find(
              (materialSample) =>
                materialSample?.id === runItem?.materialSampleId
            );
            return {
              ...runItem,
              materialSampleSummary:
                queryMaterialSampleSummary as MaterialSampleSummary
            };
          });
        }

        /**
         * Go through each of the SeqReactions and retrieve the Molecular Analysis Run. There
         * should only be one for a set of SeqReactions (1 for each SeqBatch).
         *
         * If multiple are found, the first found is returned and a warning will be displayed
         * to the user.
         */
        async function findMolecularAnalysisRun(
          sequencingRunItem: SequencingRunItem[]
        ) {
          if (
            !sequencingRunItem.some(
              (item) => item?.molecularAnalysisRunItem?.run?.id
            )
          ) {
            // Nothing to attach.
            return;
          }

          // Extract unique run IDs
          const uniqueRunIds = new Set(
            sequencingRunItem
              .filter((item) => item?.molecularAnalysisRunItem?.run?.id)
              .map((item) => item?.molecularAnalysisRunItem?.run?.id)
          );
          if (uniqueRunIds.size === 0) {
            // Nothing to attach.
            return;
          }

          // Multiple exist, display the warning.
          if (uniqueRunIds.size > 1) {
            setMultipleRunWarning(true);
          }

          const firstSequencingRun = sequencingRunItem.find(
            (item) =>
              item?.molecularAnalysisRunItem?.run?.id === [...uniqueRunIds][0]
          )?.molecularAnalysisRunItem?.run;
          if (firstSequencingRun) {
            setSequencingRun(firstSequencingRun);
            setSequencingRunName(firstSequencingRun.name);
          }
        }

        // Chain it all together to create one object.
        let sequencingRunItemsChain = attachSeqReaction(seqReactions);
        sequencingRunItemsChain = await attachMolecularAnalyisRunItem(
          sequencingRunItemsChain
        );
        sequencingRunItemsChain = await attachStorageUnitUsage(
          sequencingRunItemsChain
        );
        sequencingRunItemsChain = await attachPcrBatchItem(
          sequencingRunItemsChain
        );
        sequencingRunItemsChain = await attachMaterialSampleSummary(
          sequencingRunItemsChain
        );
        await findMolecularAnalysisRun(sequencingRunItemsChain);

        // All finished loading.
        setSequencingRunItems(sequencingRunItemsChain);
        setLoading(false);
      }
    }
  );

  // After loaded, check if we should automatically switch to edit mode.
  useEffect(() => {
    if (
      loading === false &&
      !sequencingRunItems?.some((item) => item.molecularAnalysisRunItemId) &&
      !editMode
    ) {
      setEditMode(true);
    }
  }, [sequencingRunItems, loading, editMode]);

  // Handle saving
  useEffect(() => {
    if (performSave && !loading && editMode) {
      // Determine if a new run should be created or update the existing one.
      if (sequencingRun) {
        // Update the existing one.
      } else {
        // Create a new sequencing run.
      }

      // Go back to view mode.
      setPerformSave(false);
      setEditMode(false);
    }
  }, [performSave, loading]);

  return {
    loading,
    multipleRunWarning,
    sequencingRunName,
    setSequencingRunName,
    sequencingRunItems
  };
}
