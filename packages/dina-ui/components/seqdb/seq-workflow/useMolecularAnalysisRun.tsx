import { PcrBatchItem, SeqReaction } from "packages/dina-ui/types/seqdb-api";
import { MolecularAnalysisRunItem } from "packages/dina-ui/types/seqdb-api/resources/MolecularAnalysisRunItem";
import { useEffect, useState } from "react";
import { filterBy, SaveArgs, useApiClient, useQuery } from "common-ui";
import { StorageUnitUsage } from "packages/dina-ui/types/collection-api/resources/StorageUnitUsage";
import { MolecularAnalysisRun } from "packages/dina-ui/types/seqdb-api/resources/MolecularAnalysisRun";
import { PersistedResource } from "kitsu";
import { MaterialSampleSummary } from "packages/dina-ui/types/collection-api";
import { useDinaIntl } from "../../../intl/dina-ui-intl";

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
   * Error message, undefined if no error has occurred.
   */
  errorMessage?: string;

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
  const { bulkGet, save } = useApiClient();
  const { formatMessage } = useDinaIntl();

  // Used to display if the network calls are still in progress.
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>();
  const [automaticEditMode, setAutomaticEditMode] = useState<boolean>(false);
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
      include:
        "storageUnitUsage,molecularAnalysisRunItem,molecularAnalysisRunItem.run,pcrBatchItem,seqPrimer"
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
            seqReactionId: reaction.id,
            molecularAnalysisRunItem: reaction?.molecularAnalysisRunItem,
            molecularAnalysisRunItemId: reaction?.molecularAnalysisRunItem?.id,
            storageUnitUsageId: reaction?.storageUnitUsage?.id,
            pcrBatchItemId: reaction?.pcrBatchItem?.id,
            pcrBatchItem: reaction?.pcrBatchItem as PcrBatchItem,
            materialSampleId: reaction?.pcrBatchItem?.materialSample?.id
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
      !editMode &&
      !automaticEditMode
    ) {
      setEditMode(true);
      setAutomaticEditMode(true);
    }
  }, [sequencingRunItems, loading, editMode]);

  // Reset error messages between edit modes.
  useEffect(() => {
    setErrorMessage(undefined);
  }, [editMode]);

  async function createNewRun() {
    if (!sequencingRunItems || sequencingRunItems.length === 0) {
      return;
    }

    try {
      // Retrieve the group name from the seqReaction.
      const groupName = sequencingRunItems?.[0]?.seqReaction?.group;

      // Create a new molecular analysis run.
      const molecularAnalysisRunSaveArg: SaveArgs<MolecularAnalysisRun>[] = [
        {
          type: "molecular-analysis-run",
          resource: {
            type: "molecular-analysis-run",
            name: sequencingRunName,
            group: groupName
          }
        }
      ];
      const savedMolecularAnalysisRun = await save(
        molecularAnalysisRunSaveArg,
        {
          apiBaseUrl: "/seqdb-api"
        }
      );

      // Create a run item for each seq reaction.
      const molecularAnalysisRunItemSaveArgs: SaveArgs<MolecularAnalysisRunItem>[] =
        sequencingRunItems.map(() => ({
          type: "molecular-analysis-run-item",
          resource: {
            type: "molecular-analysis-run-item",
            relationships: {
              run: {
                data: {
                  id: savedMolecularAnalysisRun[0].id,
                  type: "molecular-analysis-run"
                }
              }
            }
          } as any
        }));
      const savedMolecularAnalysisRunItem = await save(
        molecularAnalysisRunItemSaveArgs,
        { apiBaseUrl: "/seqdb-api" }
      );

      // Update the existing seq-reactions.
      const seqReactionSaveArgs: SaveArgs<SeqReaction>[] =
        sequencingRunItems.map((item, index) => ({
          type: "seq-reaction",
          resource: {
            type: "seq-reaction",
            id: item.seqReactionId,
            relationships: {
              molecularAnalysisRunItem: {
                data: {
                  id: savedMolecularAnalysisRunItem[index].id,
                  type: "molecular-analysis-run-item"
                }
              }
            }
          }
        }));
      await save(seqReactionSaveArgs, {
        apiBaseUrl: "/seqdb-api"
      });

      // Update the sequencing run items state.
      setSequencingRunItems(
        sequencingRunItems.map((item, index) => ({
          ...item,
          molecularAnalysisRunItemId: savedMolecularAnalysisRunItem[index].id,
          molecularAnalysisRunItem: savedMolecularAnalysisRunItem[
            index
          ] as MolecularAnalysisRunItem
        }))
      );

      // Go back to view mode once completed.
      setPerformSave(false);
      setEditMode(false);
      setLoading(false);
    } catch (error) {
      console.error("Error creating a new sequencing run: ", error);
      setPerformSave(false);
      setLoading(false);
      setErrorMessage(
        "Error creating a new sequencing run: " + error.toString()
      );
    }
  }

  async function updateSequencingName() {
    // Sequencing run needs an id to update.
    if (!sequencingRun?.id) {
      setPerformSave(false);
      setLoading(false);
      setErrorMessage(formatMessage("sangerRunStep_missingSequencingRunID"));
      return;
    }

    try {
      // Update the existing molecular analysis run.
      const molecularAnalysisRunSaveArg: SaveArgs<MolecularAnalysisRun>[] = [
        {
          type: "molecular-analysis-run",
          resource: {
            id: sequencingRun.id,
            type: "molecular-analysis-run",
            name: sequencingRunName
          }
        }
      ];
      await save(molecularAnalysisRunSaveArg, {
        apiBaseUrl: "/seqdb-api"
      });

      // Go back to view mode once completed.
      setPerformSave(false);
      setEditMode(false);
      setLoading(false);
    } catch (error) {
      console.error("Error updating sequencing run: ", error);
      setPerformSave(false);
      setLoading(false);
      setErrorMessage("Error updating sequencing run: " + error.toString());
    }
  }

  // Handle saving
  useEffect(() => {
    if (performSave && !loading && editMode) {
      setLoading(true);
      setErrorMessage(undefined);

      // There must be sequencingRunItems to generate.
      if (!sequencingRunItems || sequencingRunItems.length === 0) {
        setPerformSave(false);
        setLoading(false);
        setErrorMessage(
          formatMessage("sangerRunStep_missingSequenceReactions")
        );
        return;
      }

      // Ensure the sequencing name is valid.
      if (!sequencingRunName || sequencingRunName.length === 0) {
        setPerformSave(false);
        setLoading(false);
        setErrorMessage(formatMessage("sangerRunStep_invalidRunName"));
        return;
      }

      // Determine if a new run should be created or update the existing one.
      if (sequencingRun) {
        updateSequencingName();
      } else {
        createNewRun();
      }
    }
  }, [performSave, loading]);

  return {
    loading,
    errorMessage,
    multipleRunWarning,
    sequencingRunName,
    setSequencingRunName,
    sequencingRunItems
  };
}
