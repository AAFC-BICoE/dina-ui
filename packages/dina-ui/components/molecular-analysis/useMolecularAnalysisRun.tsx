import { PcrBatchItem, SeqReaction } from "../../types/seqdb-api";
import {
  ChangeEvent,
  Dispatch,
  SetStateAction,
  useEffect,
  useState
} from "react";
import {
  BulkGetOptions,
  FieldHeader,
  filterBy,
  SaveArgs,
  useApiClient,
  useQuery,
  useStringComparator
} from "common-ui";
import { StorageUnitUsage } from "../../types/collection-api/resources/StorageUnitUsage";
import { KitsuResource, PersistedResource } from "kitsu";
import { MaterialSampleSummary } from "../../types/collection-api";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";
import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { attachGenericMolecularAnalysisItems } from "../seqdb/molecular-analysis-workflow/useGenericMolecularAnalysisRun";
import { GenericMolecularAnalysisItem } from "packages/dina-ui/types/seqdb-api/resources/GenericMolecularAnalysisItem";
import { MolecularAnalysisRunItem } from "packages/dina-ui/types/seqdb-api/resources/molecular-analysis/MolecularAnalysisRunItem";
import { MolecularAnalysisRun } from "packages/dina-ui/types/seqdb-api/resources/molecular-analysis/MolecularAnalysisRun";
import { ResourceIdentifierObject } from "jsonapi-typescript";
import { MetagenomicsBatchItem } from "packages/dina-ui/types/seqdb-api/resources/metagenomics/MetagenomicsBatchItem";
import {
  attachMaterialSampleSummaryMetagenomics,
  attachMetagenomicsBatchItem,
  attachPcrBatchItemMetagenomics,
  attachStorageUnitUsageMetagenomics
} from "./useMetagenomicsWorkflowMolecularAnalysisRun";
import { QualityControl } from "packages/dina-ui/types/seqdb-api/resources/QualityControl";
import useVocabularyOptions from "../collection/useVocabularyOptions";

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

  columns: ColumnDef<SequencingRunItem>[];

  /**
   * UUID of the sequencing run.
   */
  sequencingRunId?: string;

  /**
   * Displays the current attachments. This is used since the run not might exist yet and can't
   * be saved directly.
   */
  attachments: ResourceIdentifierObject[];

  /**
   * Set the current attachments. This is used since the run not might exist yet and can't
   * be saved directly.
   */
  setAttachments: (newMetadatas: ResourceIdentifierObject[]) => void;
}

/**
 * Takes an array of SeqReactions, then turns it into the SequencingRunItem which will be
 * used to generate more data.
 * @param seqReaction
 * @returns The initial structure of SequencingRunItem.
 */
function attachSeqReaction(
  seqReaction: PersistedResource<SeqReaction>[]
): SequencingRunItem[] {
  return seqReaction.map<SequencingRunItem>((reaction) => {
    return {
      seqReaction: reaction,
      seqReactionId: reaction.id,
      molecularAnalysisRunItem: reaction?.molecularAnalysisRunItem,
      molecularAnalysisRunItemId: reaction?.molecularAnalysisRunItem?.id,
      storageUnitUsageId: reaction?.storageUnitUsage?.id,
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
async function attachStorageUnitUsage(
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
      .filter((item) => item?.storageUnitUsageId)
      .map((item) => "/storage-unit-usage/" + item?.storageUnitUsageId),
    { apiBaseUrl: "/collection-api" }
  );

  return sequencingRunItem.map((runItem) => {
    const queryStorageUnitUsage = storageUnitUsageQuery.find(
      (storageUnitUsage) => storageUnitUsage?.id === runItem?.storageUnitUsageId
    );
    return {
      ...runItem,
      storageUnitUsage: queryStorageUnitUsage as StorageUnitUsage
    };
  });
}

/**
 * Fetch MaterialSampleSummary from each PcrBatchItem.
 */
async function attachMaterialSampleSummary(
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
async function attachPcrBatchItem(
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
          "/pcr-batch-item/" + item?.pcrBatchItemId + "?include=materialSample"
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

export function useMolecularAnalysisRun({
  seqBatchId,
  editMode,
  setEditMode,
  performSave,
  setPerformSave
}: UseMolecularAnalysisRunProps): UseMolecularAnalysisRunReturn {
  const { bulkGet, save, apiClient } = useApiClient();
  const { formatMessage } = useDinaIntl();
  const { compareByStringAndNumber } = useStringComparator();
  const columns = getMolecularAnalysisRunColumns(
    compareByStringAndNumber,
    "seq-reaction"
  );

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

  // Sequencing run attachments
  const [attachments, setAttachments] = useState<ResourceIdentifierObject[]>(
    []
  );

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
            await findMolecularAnalysisRunAttachments(firstSequencingRun);
          }
        }

        async function findMolecularAnalysisRunAttachments(
          run: MolecularAnalysisRun
        ) {
          // Only perform the request if a sequencing run exists.
          if (run?.id) {
            const runQuery = await apiClient.get(
              `seqdb-api/molecular-analysis-run/${run?.id}`,
              {
                include: "attachments"
              }
            );

            if (runQuery && (runQuery as any)?.data?.attachments) {
              setAttachments((runQuery as any)?.data?.attachments);
            }
          }
        }

        // Chain it all together to create one object.
        let sequencingRunItemsChain = attachSeqReaction(seqReactions);
        sequencingRunItemsChain = await attachStorageUnitUsage(
          sequencingRunItemsChain,
          bulkGet
        );
        sequencingRunItemsChain = await attachPcrBatchItem(
          sequencingRunItemsChain,
          bulkGet
        );
        sequencingRunItemsChain = await attachMaterialSampleSummary(
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
      const groupName = sequencingRunItems?.[0]?.seqReaction?.group;

      // Create a new molecular analysis run.
      const molecularAnalysisRunSaveArg: SaveArgs<MolecularAnalysisRun>[] = [
        {
          type: "molecular-analysis-run",
          resource: {
            type: "molecular-analysis-run",
            name: sequencingRunName,
            group: groupName,
            ...(attachments.length > 0 && {
              relationships: {
                attachments: {
                  data: attachments
                }
              }
            })
          } as any
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
            usageType: "seq-reaction",
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

  async function updateSequencingRun() {
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
            name: sequencingRunName,
            relationships: {
              attachments: {
                data: attachments
              }
            }
          } as any
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
        updateSequencingRun();
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
    sequencingRunItems,
    columns,
    attachments,
    setAttachments,
    sequencingRunId: sequencingRun?.id
  };
}

export interface UseMolecularAnalysisRunViewProps {
  molecularAnalysisRunId: string;
}
export function useMolecularAnalysisRunView({
  molecularAnalysisRunId
}: UseMolecularAnalysisRunViewProps) {
  const { apiClient, bulkGet } = useApiClient();
  const [columns, setColumns] = useState<any[]>([]);
  // Run Items
  const [sequencingRunItems, setSequencingRunItems] =
    useState<SequencingRunItem[]>();
  const [loading, setLoading] = useState<boolean>(true);
  const { compareByStringAndNumber } = useStringComparator();

  // Quality control items
  const [qualityControls, setQualityControls] = useState<QualityControl[]>([]);
  const { loading: loadingVocabularyItems, vocabOptions: qualityControlTypes } =
    useVocabularyOptions({
      path: "seqdb-api/vocabulary/qualityControlType"
    });
  const molecularAnalysisRunItemQuery = useQuery<MolecularAnalysisRunItem[]>(
    {
      path: `seqdb-api/molecular-analysis-run-item`,
      filter: filterBy([], {
        extraFilters: [
          {
            selector: "run.uuid",
            comparison: "==",
            arguments: molecularAnalysisRunId
          }
        ]
      })("")
    },
    {
      onSuccess: async ({ data: molecularAnalysisRunItems }) => {
        async function fetchSeqReactions() {
          const fetchPaths = molecularAnalysisRunItems.map(
            (molecularAnalysisRunItem) =>
              `seqdb-api/seq-reaction?include=storageUnitUsage,pcrBatchItem,seqPrimer&filter[rsql]=molecularAnalysisRunItem.uuid==${molecularAnalysisRunItem.id}`
          );
          const seqReactions: PersistedResource<SeqReaction>[] = [];
          for (const path of fetchPaths) {
            const seqReaction = await apiClient.get<SeqReaction[]>(path, {});
            seqReactions.push(seqReaction.data[0]);
          }
          return seqReactions;
        }

        async function fetchGenericMolecularAnalysisItems() {
          const fetchPaths = molecularAnalysisRunItems
            .filter((runItem) => runItem.usageType !== "quality-control")
            .map(
              (molecularAnalysisRunItem) =>
                `seqdb-api/generic-molecular-analysis-item?include=storageUnitUsage,materialSample,&filter[rsql]=molecularAnalysisRunItem.uuid==${molecularAnalysisRunItem.id}`
            );
          const genericMolecularAnalysisItems: PersistedResource<GenericMolecularAnalysisItem>[] =
            [];
          for (const path of fetchPaths) {
            const genericMolecularAnalysisItem = await apiClient.get<
              GenericMolecularAnalysisItem[]
            >(path, {});
            genericMolecularAnalysisItems.push(
              genericMolecularAnalysisItem.data[0]
            );
          }
          return genericMolecularAnalysisItems;
        }
        async function fetchMetagenomicsBatchItems() {
          const fetchPaths = molecularAnalysisRunItems.map(
            (molecularAnalysisRunItem) =>
              `seqdb-api/metagenomics-batch-item?include=pcrBatchItem&filter[rsql]=molecularAnalysisRunItem.uuid==${molecularAnalysisRunItem.id}`
          );
          const metagenomicsBatchItems: PersistedResource<MetagenomicsBatchItem>[] =
            [];
          for (const path of fetchPaths) {
            const metagenomicsBatchItem = await apiClient.get<
              MetagenomicsBatchItem[]
            >(path, {});
            metagenomicsBatchItems.push(metagenomicsBatchItem.data[0]);
          }
          return metagenomicsBatchItems;
        }

        const usageType = molecularAnalysisRunItems.filter(
          (runItem) => runItem.usageType !== "quality-control"
        )?.[0].usageType;
        setColumns(
          getMolecularAnalysisRunColumns(
            compareByStringAndNumber,
            usageType,
            undefined,
            true
          )
        );

        if (usageType === "seq-reaction") {
          const seqReactions = await fetchSeqReactions();

          // Chain it all together to create one object.
          let sequencingRunItemsChain = attachSeqReaction(seqReactions);
          sequencingRunItemsChain = await attachStorageUnitUsage(
            sequencingRunItemsChain,
            bulkGet
          );

          sequencingRunItemsChain = await attachPcrBatchItem(
            sequencingRunItemsChain,
            bulkGet
          );
          sequencingRunItemsChain = await attachMaterialSampleSummary(
            sequencingRunItemsChain,
            bulkGet
          );

          // All finished loading.
          setSequencingRunItems(sequencingRunItemsChain);
          setLoading(false);
        } else if (usageType === "generic-molecular-analysis-item") {
          const genericMolecularAnalysisItems =
            await fetchGenericMolecularAnalysisItems();
          let sequencingRunItemsChain = attachGenericMolecularAnalysisItems(
            genericMolecularAnalysisItems
          );
          sequencingRunItemsChain = await attachStorageUnitUsage(
            sequencingRunItemsChain,
            bulkGet
          );
          sequencingRunItemsChain = await attachMaterialSampleSummary(
            sequencingRunItemsChain,
            bulkGet
          );
          const qualityControlRunItems = molecularAnalysisRunItems.filter(
            (runItem) => runItem.usageType === "quality-control"
          );
          // Get quality controls
          if (qualityControlRunItems && qualityControlRunItems?.length > 0) {
            const newQualityControls: QualityControl[] = [];

            // Go through each quality control run item and then we do a query for each quality control.
            for (const item of qualityControlRunItems) {
              const qualityControlQuery = await apiClient.get<QualityControl>(
                `seqdb-api/quality-control`,
                {
                  filter: filterBy([], {
                    extraFilters: [
                      {
                        selector: "molecularAnalysisRunItem.uuid",
                        comparison: "==",
                        arguments: item?.id
                      }
                    ]
                  })(""),
                  include: "molecularAnalysisRunItem"
                }
              );

              const qualityControlFound = qualityControlQuery
                ?.data?.[0] as QualityControl;
              if (qualityControlFound) {
                newQualityControls.push({
                  ...qualityControlFound
                });
              }
            }

            setQualityControls(newQualityControls);
          }
          // All finished loading.
          setSequencingRunItems(sequencingRunItemsChain);
          setLoading(false);
        } else if (usageType === "metagenomics-batch-item") {
          const metagenomicsBatchItems = await fetchMetagenomicsBatchItems();

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
          sequencingRunItemsChain =
            await attachMaterialSampleSummaryMetagenomics(
              sequencingRunItemsChain,
              bulkGet
            );
          // All finished loading.
          setSequencingRunItems(sequencingRunItemsChain);
          setLoading(false);
        }
      }
    }
  );
  return {
    loading:
      molecularAnalysisRunItemQuery.loading ||
      loadingVocabularyItems ||
      loading,
    sequencingRunItems,
    columns,
    qualityControls,
    qualityControlTypes
  };
}

export function getMolecularAnalysisRunColumns(
  compareByStringAndNumber,
  type,
  setMolecularAnalysisRunItemNames?: Dispatch<
    SetStateAction<Record<string, string>>
  >,
  readOnly?: boolean
) {
  // Table columns to display for the sequencing run.
  const SEQ_REACTION_COLUMNS: ColumnDef<SequencingRunItem>[] = [
    {
      id: "wellCoordinates",
      cell: ({ row }) => {
        return (
          <>
            {!row.original?.storageUnitUsage ||
            row.original?.storageUnitUsage?.wellRow === null ||
            row.original?.storageUnitUsage?.wellColumn === null
              ? ""
              : `${row.original.storageUnitUsage?.wellRow}${row.original.storageUnitUsage?.wellColumn}`}
          </>
        );
      },
      header: () => <FieldHeader name={"wellCoordinates"} />,
      accessorKey: "wellCoordinates",
      sortingFn: (a: any, b: any): number => {
        const aString =
          !a.original?.storageUnitUsage ||
          a.original?.storageUnitUsage?.wellRow === null ||
          a.original?.storageUnitUsage?.wellColumn === null
            ? ""
            : `${a.original.storageUnitUsage?.wellRow}${a.original.storageUnitUsage?.wellColumn}`;
        const bString =
          !b.original?.storageUnitUsage ||
          b.original?.storageUnitUsage?.wellRow === null ||
          b.original?.storageUnitUsage?.wellColumn === null
            ? ""
            : `${b.original.storageUnitUsage?.wellRow}${b.original.storageUnitUsage?.wellColumn}`;
        return compareByStringAndNumber(aString, bString);
      }
    },
    {
      id: "tubeNumber",
      cell: ({ row: { original } }) =>
        original?.storageUnitUsage?.cellNumber === undefined ? (
          <></>
        ) : (
          <>{original.storageUnitUsage?.cellNumber}</>
        ),
      header: () => <FieldHeader name={"tubeNumber"} />,
      accessorKey: "tubeNumber",
      sortingFn: (a: any, b: any): number =>
        compareByStringAndNumber(
          a?.original?.storageUnitUsage?.cellNumber?.toString(),
          b?.original?.storageUnitUsage?.cellNumber?.toString()
        )
    },
    {
      id: "materialSampleName",
      cell: ({ row: { original } }) => {
        const materialSampleName =
          original?.materialSampleSummary?.materialSampleName;
        return (
          <>
            <Link
              href={`/collection/material-sample/view?id=${original.materialSampleId}`}
            >
              <a>{materialSampleName || original.materialSampleId}</a>
            </Link>
            {" ("}
            {original?.seqReaction?.seqPrimer?.name}
            {")"}
          </>
        );
      },
      header: () => <FieldHeader name="materialSampleName" />,
      accessorKey: "materialSampleSummary.materialSampleName",
      sortingFn: (a: any, b: any): number =>
        compareByStringAndNumber(
          a?.original?.materialSampleSummary?.materialSampleName,
          b?.original?.materialSampleSummary?.materialSampleName
        ),
      enableSorting: true
    }
  ];

  const GENERIC_MOLECULAR_ANALYSIS_COLUMNS: ColumnDef<SequencingRunItem>[] = [
    {
      id: "wellCoordinates",
      cell: ({ row }) => {
        return (
          <>
            {!row.original?.storageUnitUsage ||
            row.original?.storageUnitUsage?.wellRow === null ||
            row.original?.storageUnitUsage?.wellColumn === null
              ? ""
              : `${row.original.storageUnitUsage?.wellRow}${row.original.storageUnitUsage?.wellColumn}`}
          </>
        );
      },
      header: () => <FieldHeader name={"wellCoordinates"} />,
      accessorKey: "wellCoordinates",
      sortingFn: (a: any, b: any): number => {
        const aString =
          !a.original?.storageUnitUsage ||
          a.original?.storageUnitUsage?.wellRow === null ||
          a.original?.storageUnitUsage?.wellColumn === null
            ? ""
            : `${a.original.storageUnitUsage?.wellRow}${a.original.storageUnitUsage?.wellColumn}`;
        const bString =
          !b.original?.storageUnitUsage ||
          b.original?.storageUnitUsage?.wellRow === null ||
          b.original?.storageUnitUsage?.wellColumn === null
            ? ""
            : `${b.original.storageUnitUsage?.wellRow}${b.original.storageUnitUsage?.wellColumn}`;
        return compareByStringAndNumber(aString, bString);
      }
    },
    {
      id: "tubeNumber",
      cell: ({ row: { original } }) =>
        original?.storageUnitUsage?.cellNumber === undefined ? (
          <></>
        ) : (
          <>{original.storageUnitUsage?.cellNumber}</>
        ),
      header: () => <FieldHeader name={"tubeNumber"} />,
      accessorKey: "tubeNumber",
      sortingFn: (a: any, b: any): number =>
        compareByStringAndNumber(
          a?.original?.storageUnitUsage?.cellNumber?.toString(),
          b?.original?.storageUnitUsage?.cellNumber?.toString()
        )
    },
    {
      id: "materialSampleName",
      cell: ({ row: { original } }) => {
        const materialSampleName =
          original?.materialSampleSummary?.materialSampleName;
        return (
          <>
            <Link
              href={`/collection/material-sample/view?id=${original.materialSampleId}`}
            >
              <a>{materialSampleName || original.materialSampleId}</a>
            </Link>
          </>
        );
      },
      header: () => <FieldHeader name="materialSampleName" />,
      accessorKey: "materialSampleSummary.materialSampleName",
      sortingFn: (a: any, b: any): number =>
        compareByStringAndNumber(
          a?.original?.materialSampleSummary?.materialSampleName,
          b?.original?.materialSampleSummary?.materialSampleName
        ),
      enableSorting: true
    },
    {
      id: "molecularAnalysisRunItem.name",
      cell: ({ row: { original } }) => {
        return readOnly ? (
          <>{original.molecularAnalysisRunItem?.name}</>
        ) : (
          <input
            type="text"
            className="w-100 form-control"
            defaultValue={original.molecularAnalysisRunItem?.name}
            onChange={(event: ChangeEvent<HTMLInputElement>) => {
              setMolecularAnalysisRunItemNames?.(
                (molecularAnalysisRunItemNames) => {
                  const molecularAnalysisRunItemNamesMap =
                    molecularAnalysisRunItemNames;
                  if (
                    original?.materialSampleSummary?.id &&
                    event.target.value
                  ) {
                    molecularAnalysisRunItemNamesMap[
                      original?.materialSampleSummary?.id
                    ] = event.target.value;
                  }
                  return molecularAnalysisRunItemNamesMap;
                }
              );
            }}
          />
        );
      },
      header: () => <DinaMessage id="molecularAnalysisRunItemName" />,
      accessorKey: "molecularAnalysisRunItem.name",
      sortingFn: (a: any, b: any): number =>
        compareByStringAndNumber(
          a?.original?.materialSampleSummary?.materialSampleName,
          b?.original?.materialSampleSummary?.materialSampleName
        ),
      enableSorting: true
    }
  ];

  const METAGENOMICS_BATCH_ITEM_COLUMNS: ColumnDef<SequencingRunItem>[] = [
    {
      id: "wellCoordinates",
      cell: ({ row }) => {
        return (
          <>
            {!row.original?.storageUnitUsage ||
            row.original?.storageUnitUsage?.wellRow === null ||
            row.original?.storageUnitUsage?.wellColumn === null
              ? ""
              : `${row.original.storageUnitUsage?.wellRow}${row.original.storageUnitUsage?.wellColumn}`}
          </>
        );
      },
      header: () => <FieldHeader name={"wellCoordinates"} />,
      accessorKey: "wellCoordinates",
      sortingFn: (a: any, b: any): number => {
        const aString =
          !a.original?.storageUnitUsage ||
          a.original?.storageUnitUsage?.wellRow === null ||
          a.original?.storageUnitUsage?.wellColumn === null
            ? ""
            : `${a.original.storageUnitUsage?.wellRow}${a.original.storageUnitUsage?.wellColumn}`;
        const bString =
          !b.original?.storageUnitUsage ||
          b.original?.storageUnitUsage?.wellRow === null ||
          b.original?.storageUnitUsage?.wellColumn === null
            ? ""
            : `${b.original.storageUnitUsage?.wellRow}${b.original.storageUnitUsage?.wellColumn}`;
        return compareByStringAndNumber(aString, bString);
      }
    },
    {
      id: "tubeNumber",
      cell: ({ row: { original } }) =>
        original?.storageUnitUsage?.cellNumber === undefined ? (
          <></>
        ) : (
          <>{original.storageUnitUsage?.cellNumber}</>
        ),
      header: () => <FieldHeader name={"tubeNumber"} />,
      accessorKey: "tubeNumber",
      sortingFn: (a: any, b: any): number =>
        compareByStringAndNumber(
          a?.original?.storageUnitUsage?.cellNumber?.toString(),
          b?.original?.storageUnitUsage?.cellNumber?.toString()
        )
    },
    {
      id: "materialSampleName",
      cell: ({ row: { original } }) => {
        const materialSampleName =
          original?.materialSampleSummary?.materialSampleName;
        return (
          <>
            <Link
              href={`/collection/material-sample/view?id=${original.materialSampleId}`}
            >
              <a>{materialSampleName || original.materialSampleId}</a>
            </Link>
          </>
        );
      },
      header: () => <FieldHeader name="materialSampleName" />,
      accessorKey: "materialSampleSummary.materialSampleName",
      sortingFn: (a: any, b: any): number =>
        compareByStringAndNumber(
          a?.original?.materialSampleSummary?.materialSampleName,
          b?.original?.materialSampleSummary?.materialSampleName
        ),
      enableSorting: true
    }
  ];
  const MOLECULAR_ANALYSIS_RUN_COLUMNS_MAP = {
    "seq-reaction": SEQ_REACTION_COLUMNS,
    "generic-molecular-analysis-item": GENERIC_MOLECULAR_ANALYSIS_COLUMNS,
    "metagenomics-batch-item": METAGENOMICS_BATCH_ITEM_COLUMNS
  };
  return MOLECULAR_ANALYSIS_RUN_COLUMNS_MAP[type];
}
