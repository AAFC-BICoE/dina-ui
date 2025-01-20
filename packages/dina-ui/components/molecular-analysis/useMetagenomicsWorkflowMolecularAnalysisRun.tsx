import { PcrBatchItem } from "../../types/seqdb-api";
import {
  MolecularAnalysisRunItem,
  MolecularAnalysisRunItemUsageType
} from "../../types/seqdb-api/resources/molecular-analysis/MolecularAnalysisRunItem";
import { useEffect, useState } from "react";
import {
  BulkGetOptions,
  filterBy,
  SaveArgs,
  useApiClient,
  useQuery
} from "common-ui";
import { StorageUnitUsage } from "../../types/collection-api/resources/StorageUnitUsage";
import { MolecularAnalysisRun } from "../../types/seqdb-api/resources/molecular-analysis/MolecularAnalysisRun";
import { KitsuResource, PersistedResource } from "kitsu";
import { MaterialSampleSummary } from "../../types/collection-api";
import { useDinaIntl } from "../../intl/dina-ui-intl";
import { ColumnDef } from "@tanstack/react-table";
import { MetagenomicsBatchItem } from "packages/dina-ui/types/seqdb-api/resources/metagenomics/MetagenomicsBatchItem";
import { MetagenomicsBatch } from "packages/dina-ui/types/seqdb-api/resources/metagenomics/MetagenomicsBatch";
import { useMolecularAnalysisRunColumns } from "./useMolecularAnalysisRunColumns";

export interface UseMetagenomicsWorkflowMolecularAnalysisRunProps {
  metagenomicsBatchId: string;
  metagenomicsBatch: MetagenomicsBatch;
  editMode: boolean;
  setEditMode: (newValue: boolean) => void;
  performSave: boolean;
  setPerformSave: (newValue: boolean) => void;
}

/**
 * Represents data to be displayed in the table.
 */
export interface SequencingRunItem {
  metagenomicsBatchItem?: MetagenomicsBatchItem;
  metagenomicsBatchItemId?: string;

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

  columns: ColumnDef<SequencingRunItem>[];
}

/**
 * Takes an array of MetagenomicsBatchItem, then turns it into the SequencingRunItem which will be
 * used to generate more data.
 * @param metagenomicsBatchItem
 * @returns The initial structure of SequencingRunItem.
 */
export function attachMetagenomicsBatchItem(
  metagenomicsBatchItem: PersistedResource<MetagenomicsBatchItem>[]
): SequencingRunItem[] {
  return metagenomicsBatchItem.map<SequencingRunItem>((reaction) => {
    return {
      metagenomicsBatchItem: reaction,
      metagenomicsBatchItemId: reaction.id,
      molecularAnalysisRunItem: reaction?.molecularAnalysisRunItem,
      molecularAnalysisRunItemId: reaction?.molecularAnalysisRunItem?.id,
      pcrBatchItemId: reaction?.pcrBatchItem?.id,
      pcrBatchItem: reaction?.pcrBatchItem as PcrBatchItem,
      materialSampleId: reaction?.pcrBatchItem?.materialSample?.id
    };
  });
}

/**
 * Fetch StorageUnitUsage linked to each SeqReactions. This will perform the API request
 * to retrieve the full storage unit since it's stored in the collection-api.
 * @returns The updated SeqReactionSample with storage unit attached.
 */
export async function attachStorageUnitUsageMetagenomics(
  sequencingRunItem: SequencingRunItem[],
  bulkGet: <T extends KitsuResource, TReturnNull extends boolean = false>(
    paths: readonly string[],
    options?: BulkGetOptions
  ) => Promise<
    (TReturnNull extends true
      ? PersistedResource<T> | null
      : PersistedResource<T>)[]
  >
): Promise<SequencingRunItem[]> {
  const storageUnitUsageQuery = await bulkGet<StorageUnitUsage>(
    sequencingRunItem
      .filter((item) => item?.pcrBatchItem?.storageUnitUsage?.id)
      .map(
        (item) =>
          "/storage-unit-usage/" + item?.pcrBatchItem?.storageUnitUsage?.id
      ),
    { apiBaseUrl: "/collection-api" }
  );

  return sequencingRunItem.map((runItem) => {
    const queryStorageUnitUsage = storageUnitUsageQuery.find(
      (storageUnitUsage) =>
        storageUnitUsage?.id === runItem?.pcrBatchItem?.storageUnitUsage?.id
    );
    return {
      ...runItem,
      storageUnitUsage: queryStorageUnitUsage as StorageUnitUsage,
      storageUnitUsageId: queryStorageUnitUsage?.id
    };
  });
}

/**
 * Fetch MaterialSampleSummary from each PcrBatchItem.
 */
export async function attachMaterialSampleSummaryMetagenomics(
  sequencingRunItem: SequencingRunItem[],
  bulkGet: <T extends KitsuResource, TReturnNull extends boolean = false>(
    paths: readonly string[],
    options?: BulkGetOptions
  ) => Promise<
    (TReturnNull extends true
      ? PersistedResource<T> | null
      : PersistedResource<T>)[]
  >
): Promise<SequencingRunItem[]> {
  const materialSampleSummaryQuery = await bulkGet<MaterialSampleSummary>(
    sequencingRunItem
      .filter((item) => item?.materialSampleId)
      .map((item) => "/material-sample-summary/" + item?.materialSampleId),
    { apiBaseUrl: "/collection-api" }
  );

  return sequencingRunItem.map((runItem) => {
    const queryMaterialSampleSummary = materialSampleSummaryQuery.find(
      (materialSample) => materialSample?.id === runItem?.materialSampleId
    );
    return {
      ...runItem,
      materialSampleSummary: queryMaterialSampleSummary as MaterialSampleSummary
    };
  });
}

/**
 * Fetch PcrBatchItem linked to each SeqReactions.
 */
export async function attachPcrBatchItemMetagenomics(
  sequencingRunItem: SequencingRunItem[],
  bulkGet: <T extends KitsuResource, TReturnNull extends boolean = false>(
    paths: readonly string[],
    options?: BulkGetOptions
  ) => Promise<
    (TReturnNull extends true
      ? PersistedResource<T> | null
      : PersistedResource<T>)[]
  >
): Promise<SequencingRunItem[]> {
  const pcrBatchItemQuery = await bulkGet<PcrBatchItem>(
    sequencingRunItem
      .filter((item) => item?.pcrBatchItemId)
      .map(
        (item) =>
          "/pcr-batch-item/" +
          item?.pcrBatchItemId +
          "?include=materialSample,storageUnitUsage"
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
      materialSampleId: queryPcrBatchItem?.materialSample?.id,
      storageUnitUsageId: queryPcrBatchItem?.storageUnitUsage?.id
    };
  });
}

export function useMetagenomicsWorkflowMolecularAnalysisRun({
  metagenomicsBatchId,
  metagenomicsBatch,
  editMode,
  setEditMode,
  performSave,
  setPerformSave
}: UseMetagenomicsWorkflowMolecularAnalysisRunProps): UseMolecularAnalysisRunReturn {
  const { bulkGet, save } = useApiClient();
  const { formatMessage } = useDinaIntl();
  // Map of MolecularAnalysisRunItem {id:name}
  const [molecularAnalysisRunItemNames, setMolecularAnalysisRunItemNames] =
    useState<Record<string, string>>({});

  const columns = useMolecularAnalysisRunColumns({
    type: "metagenomics-batch-item",
    setMolecularAnalysisRunItemNames,
    readOnly: !editMode
  });

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

  // Used to determine if the resource needs to be reloaded.
  const [reloadResource, setReloadResource] = useState<number>(Date.now());

  // Network Requests, starting with the SeqReaction
  const { loading: loadingMetagenomicsBatchItems } = useQuery<
    MetagenomicsBatchItem[]
  >(
    {
      filter: filterBy([], {
        extraFilters: [
          {
            selector: "metagenomicsBatch.uuid",
            comparison: "==",
            arguments: metagenomicsBatchId
          }
        ]
      })(""),
      page: { limit: 1000 },
      path: `seqdb-api/metagenomics-batch-item`,
      include:
        "indexI5,indexI7,pcrBatchItem,molecularAnalysisRunItem,molecularAnalysisRunItem.run"
    },
    {
      deps: [reloadResource],
      onSuccess: async ({ data: metagenomicsBatchItems }) => {
        /**
         * Go through each of the MetagenomicsBatchItems and retrieve the Molecular Analysis Run. There
         * should only be one for a set of MetagenomicsBatchItems
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
        let sequencingRunItemsChain = attachMetagenomicsBatchItem(
          metagenomicsBatchItems
        );
        sequencingRunItemsChain = await attachPcrBatchItemMetagenomics(
          sequencingRunItemsChain,
          bulkGet
        );
        sequencingRunItemsChain = await attachStorageUnitUsageMetagenomics(
          sequencingRunItemsChain,
          bulkGet
        );

        sequencingRunItemsChain = await attachMaterialSampleSummaryMetagenomics(
          sequencingRunItemsChain,
          bulkGet
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
      const groupName = metagenomicsBatch?.group;

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

      // Create a MolecularAnalysisRunitem for each MetagenomicsBatchItem.
      const molecularAnalysisRunItemSaveArgs: SaveArgs<MolecularAnalysisRunItem>[] =
        sequencingRunItems.map((item) => {
          const molecularAnalysisRunItemName = item.materialSampleSummary?.id
            ? molecularAnalysisRunItemNames[item.materialSampleSummary?.id]
            : undefined;
          return {
            type: "molecular-analysis-run-item",
            resource: {
              type: "molecular-analysis-run-item",
              usageType:
                MolecularAnalysisRunItemUsageType.METAGENOMICS_BATCH_ITEM,
              ...(molecularAnalysisRunItemName && {
                name: molecularAnalysisRunItemName
              }),
              relationships: {
                run: {
                  data: {
                    id: savedMolecularAnalysisRun[0].id,
                    type: "molecular-analysis-run"
                  }
                }
              }
            } as any
          };
        });
      const savedMolecularAnalysisRunItem = await save(
        molecularAnalysisRunItemSaveArgs,
        { apiBaseUrl: "/seqdb-api" }
      );

      // Update the existing MetagenomicsBatchItems.
      const metagenomicsBatchItemsSaveArgs: SaveArgs<MetagenomicsBatchItem>[] =
        sequencingRunItems.map((item, index) => ({
          type: "metagenomics-batch-item",
          resource: {
            type: "metagenomics-batch-item",
            id: item.metagenomicsBatchItemId,
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
      await save(metagenomicsBatchItemsSaveArgs, {
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

      // Update existing MolecularAnalysisRunItem names
      if (sequencingRunItems) {
        const molecularAnalysisRunItemSaveArgs: SaveArgs<MolecularAnalysisRunItem>[] =
          [];
        sequencingRunItems.forEach((item) => {
          const molecularAnalysisRunItemName = item.materialSampleSummary?.id
            ? molecularAnalysisRunItemNames[item.materialSampleSummary?.id]
            : undefined;
          if (molecularAnalysisRunItemName) {
            molecularAnalysisRunItemSaveArgs.push({
              type: "molecular-analysis-run-item",
              resource: {
                id: item.molecularAnalysisRunItemId,
                type: "molecular-analysis-run-item",
                name: molecularAnalysisRunItemName
              }
            });
          }
        });
        if (molecularAnalysisRunItemSaveArgs.length) {
          await save(molecularAnalysisRunItemSaveArgs, {
            apiBaseUrl: "/seqdb-api"
          });
        }
      }

      // Go back to view mode once completed.
      setPerformSave(false);
      setEditMode(false);
      setLoading(false);
      setReloadResource(Date.now());
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
    loading: loading || loadingMetagenomicsBatchItems,
    errorMessage,
    multipleRunWarning,
    sequencingRunName,
    setSequencingRunName,
    sequencingRunItems,
    columns
  };
}
