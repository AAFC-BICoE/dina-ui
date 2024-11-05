import { SeqReaction } from "packages/dina-ui/types/seqdb-api";
import { MolecularAnalysisRunItem } from "packages/dina-ui/types/seqdb-api/resources/MolecularAnalysisRunItem";
import { useState } from "react";
import { filterBy, useApiClient, useQuery } from "common-ui";
import { StorageUnitUsage } from "packages/dina-ui/types/collection-api/resources/StorageUnitUsage";
import { MolecularAnalysisRun } from "packages/dina-ui/types/seqdb-api/resources/MolecularAnalysisRun";

export interface UseMolecularAnalysisRunProps {
  seqBatchId: string;
  editMode: boolean;
  performSave: boolean;
}

/**
 * Represents data to be displayed in the table.
 */
export interface SequencingRunItem {
  seqReaction?: SeqReaction;
  storageUnitUsage?: StorageUnitUsage;
  molecularAnalysisRunItem?: MolecularAnalysisRunItem;
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
  seqBatchId
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
         * @returns
         */
        function attachSeqReaction(
          seqReaction: SeqReaction[]
        ): SequencingRunItem[] {
          return seqReaction.map<SequencingRunItem>((reaction) => ({
            seqReaction: reaction
          }));
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
              .filter((item) => item?.seqReaction?.storageUnitUsage?.id)
              .map(
                (item) =>
                  "/storage-unit-usage/" +
                  item?.seqReaction?.storageUnitUsage?.id
              ),
            { apiBaseUrl: "/collection-api" }
          );

          return sequencingRunItem.map((runItem) => {
            const queryStorageUnitUsage = storageUnitUsageQuery.find(
              (storageUnitUsage) =>
                storageUnitUsage?.id ===
                runItem?.seqReaction?.storageUnitUsage?.id
            );
            return {
              ...runItem,
              storageUnitUsage: queryStorageUnitUsage as StorageUnitUsage
            };
          });
        }

        async function attachMolecularAnalyisRunItem(
          sequencingRunItem: SequencingRunItem[]
        ): Promise<SequencingRunItem[]> {
          const molecularAnalyisRunItemQuery =
            await bulkGet<MolecularAnalysisRunItem>(
              sequencingRunItem
                .filter(
                  (item) => item?.seqReaction?.molecularAnalysisRunItem?.id
                )
                .map(
                  (item) =>
                    "/molecular-analysis-run-item/" +
                    item?.seqReaction?.molecularAnalysisRunItem?.id +
                    "?include=molecularAnalysisRun"
                ),
              { apiBaseUrl: "/seqdb-api" }
            );

          return sequencingRunItem.map((runItem) => {
            const queryStorageUnitUsage = molecularAnalyisRunItemQuery.find(
              (molecularRunItem) =>
                molecularRunItem?.id ===
                runItem?.seqReaction?.molecularAnalysisRunItem?.id
            );

            return {
              ...runItem,
              molecularAnalysisRunItem:
                queryStorageUnitUsage as MolecularAnalysisRunItem
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

          const molecularAnalysisRunQuery =
            await apiClient.get<MolecularAnalysisRun>(
              "/seqdb-api/molecular-analysis-run/" + uniqueRunIds[0],
              {}
            );
        }

        // Chain it all together to create one object.
        const sequencingRunItemsFromReactions = attachSeqReaction(seqReactions);
        const sequencingRunItemsWithMolecularRunItems =
          await attachMolecularAnalyisRunItem(sequencingRunItemsFromReactions);
        const sequencingRunItemsWithStorage = await attachStorageUnitUsage(
          sequencingRunItemsWithMolecularRunItems
        );

        await findMolecularAnalysisRun(sequencingRunItemsWithStorage);
        setSequencingRunItems(sequencingRunItemsWithStorage);
        setLoading(false);
      }
    }
  );

  return {
    loading,
    multipleRunWarning,
    sequencingRunName,
    setSequencingRunName,
    sequencingRunItems
  };
}
