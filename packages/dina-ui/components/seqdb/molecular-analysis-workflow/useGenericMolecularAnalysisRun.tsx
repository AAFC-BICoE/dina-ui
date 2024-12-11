import { useEffect, useState } from "react";
import { filterBy, SaveArgs, useApiClient, useQuery } from "common-ui";
import { StorageUnitUsage } from "packages/dina-ui/types/collection-api/resources/StorageUnitUsage";
import { PersistedResource } from "kitsu";
import { MaterialSampleSummary } from "packages/dina-ui/types/collection-api";
import { useDinaIntl } from "../../../intl/dina-ui-intl";
import { GenericMolecularAnalysisItem } from "packages/dina-ui/types/seqdb-api/resources/GenericMolecularAnalysisItem";
import { GenericMolecularAnalysis } from "packages/dina-ui/types/seqdb-api/resources/GenericMolecularAnalysis";
import { MolecularAnalysisRunItem } from "packages/dina-ui/types/seqdb-api/resources/molecular-analysis/MolecularAnalysisRunItem";
import { MolecularAnalysisRun } from "packages/dina-ui/types/seqdb-api/resources/molecular-analysis/MolecularAnalysisRun";
import { ResourceIdentifierObject } from "jsonapi-typescript";
import { QualityControl } from "packages/dina-ui/types/seqdb-api/resources/QualityControl";
import useVocabularyOptions from "../../collection/useVocabularyOptions";
import { VocabularyOption } from "../../collection/VocabularySelectField";

export interface UseGenericMolecularAnalysisRunProps {
  molecularAnalysis: GenericMolecularAnalysis;
  molecularAnalysisId: string;
  editMode: boolean;
  setEditMode: (newValue: boolean) => void;
  performSave: boolean;
  setPerformSave: (newValue: boolean) => void;
}

/**
 * Represents data to be displayed in the table.
 */
export interface SequencingRunItem {
  molecularAnalysisItem?: GenericMolecularAnalysisItem;
  molecularAnalysisItemId?: string;

  storageUnitUsage?: StorageUnitUsage;
  storageUnitUsageId?: string;

  molecularAnalysisRunItem?: MolecularAnalysisRunItem;
  molecularAnalysisRunItemId?: string;

  materialSampleSummary?: MaterialSampleSummary;
  materialSampleId?: string;
}

export interface UseGenericMolecularAnalysisRunReturn {
  /**
   * Used to display if the network calls are still in progress.
   */
  loading: boolean;

  /**
   * Error message, undefined if no error has occurred.
   */
  errorMessage?: string;

  /**
   * Only 1 MolecularAnalysisRun should be present for each Molecular Analysis, if multiple are
   * found this will return true and a warning can be displayed in the UI.
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

  /**
   * UUID of the sequencing run.
   */
  sequencingRunId?: string;

  /**
   * List of quality controls to be displayed. This is also used when they don't exist to be saved
   * in.
   */
  qualityControls: QualityControl[];

  /**
   * List of vocabularies options for the quality control type.
   */
  qualityControlTypes: VocabularyOption[];

  /**
   * Generates a blank quality control for the user to enter.
   */
  createNewQualityControl: () => void;

  /**
   * Based on the index, delete the quality control.
   *
   * @param index Index relative to the qualityControls array.
   */
  deleteQualityControl: (index: number) => void;

  /**
   * Updates an existing quality control at the specified index with a new quality control object.
   *
   * @param {number} index - The index of the quality control to be updated.
   * @param {QualityControl} newQualityControl - The new quality control object to replace the old one.
   */
  updateQualityControl: (
    index: number,
    newQualityControl: QualityControl
  ) => void;

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

export function useGenericMolecularAnalysisRun({
  molecularAnalysisId,
  molecularAnalysis,
  editMode,
  setEditMode,
  performSave,
  setPerformSave
}: UseGenericMolecularAnalysisRunProps): UseGenericMolecularAnalysisRunReturn {
  const { bulkGet, save, apiClient } = useApiClient();
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

  // Quality control items
  const [qualityControls, setQualityControls] = useState<QualityControl[]>([]);

  // Sequencing run attachments
  const [attachments, setAttachments] = useState<ResourceIdentifierObject[]>(
    []
  );

  const { loading: loadingVocabularyItems, vocabOptions: qualityControlTypes } =
    useVocabularyOptions({
      path: "seqdb-api/vocabulary/qualityControlType"
    });

  // Network Requests, starting with the GenericMolecularAnalysisItem
  useQuery<GenericMolecularAnalysisItem[]>(
    {
      filter: filterBy([], {
        extraFilters: [
          {
            selector: "genericMolecularAnalysis.uuid",
            comparison: "==",
            arguments: molecularAnalysisId
          }
        ]
      })(""),
      page: { limit: 1000 },
      path: `/seqdb-api/generic-molecular-analysis-item`,
      include:
        "storageUnitUsage,materialSample,molecularAnalysisRunItem,molecularAnalysisRunItem.run"
    },
    {
      onSuccess: async ({ data: genericMolecularAnalysisItems }) => {
        /**
         * Fetch StorageUnitUsage linked to each GenericMolecularAnalysisItems. This will perform the API request
         * to retrieve the full storage unit since it's stored in the collection-api.
         * @returns The updated SequencingRunItem with storage unit attached.
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
         * Go through each of the GenericMolecularAnalysisItems and retrieve the Molecular Analysis Run. There
         * should only be one for a set of GenericMolecularAnalysisItems (1 for each Molecular Analysis).
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
        let sequencingRunItemsChain = attachGenericMolecularAnalysisItems(
          genericMolecularAnalysisItems
        );
        sequencingRunItemsChain = await attachStorageUnitUsage(
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

  /**
   * Creates a new quality control object and adds it to the existing quality controls list.
   */
  function createNewQualityControl() {
    setQualityControls([
      ...qualityControls,
      {
        group: "",
        name: "",
        qcType: "",
        type: "quality-control"
      }
    ]);
  }

  /**
   * Updates an existing quality control at the specified index with a new quality control object.
   *
   * @param {number} index - The index of the quality control to be updated.
   * @param {QualityControl} newQualityControl - The new quality control object to replace the old one.
   */
  function updateQualityControl(
    index: number,
    newQualityControl: QualityControl
  ) {
    // Create a copy of the existing quality controls array
    const updatedQualityControls = [...qualityControls];

    // Update the quality control at the specified index with the new one
    updatedQualityControls[index] = newQualityControl;

    // Update the state with the modified array
    setQualityControls(updatedQualityControls);
  }

  /**
   * Deletes a quality control from the list at the specified index.
   *
   * @param {number} index - The index of the quality control to be deleted.
   */
  function deleteQualityControl(index: number) {
    // Create a new array without the item at the specified index
    const newQualityControls = qualityControls.filter((_, i) => i !== index);

    // Update the state with the new array
    setQualityControls(newQualityControls);
  }

  async function createNewRun() {
    if (
      !sequencingRunItems ||
      !molecularAnalysis ||
      sequencingRunItems.length === 0
    ) {
      return;
    }

    try {
      // Retrieve the group name from the first step.
      const groupName = molecularAnalysis.group;

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
            usageType: "generic-molecular-analysis-item",
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
      const genericMolecularAnalysisItemSaveArgs: SaveArgs<GenericMolecularAnalysisItem>[] =
        sequencingRunItems.map((item, index) => ({
          type: "generic-molecular-analysis-item",
          resource: {
            type: "generic-molecular-analysis-item",
            id: item.molecularAnalysisItemId,
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
      await save(genericMolecularAnalysisItemSaveArgs, {
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
      setErrorMessage(
        formatMessage("molecularAnalysisRunStep_missingSequencingRunID")
      );
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
          formatMessage("molecularAnalysisRunStep_missingSequenceReactions")
        );
        return;
      }

      // Ensure the sequencing name is valid.
      if (!sequencingRunName || sequencingRunName.length === 0) {
        setPerformSave(false);
        setLoading(false);
        setErrorMessage(
          formatMessage("molecularAnalysisRunStep_invalidRunName")
        );
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
    loading: loading || loadingVocabularyItems,
    errorMessage,
    multipleRunWarning,
    sequencingRunName,
    setSequencingRunName,
    sequencingRunItems,
    attachments,
    qualityControls,
    qualityControlTypes,
    createNewQualityControl,
    deleteQualityControl,
    updateQualityControl,
    setAttachments,
    sequencingRunId: sequencingRun?.id
  };
}

/**
 * Takes an array of GenericMolecularAnalysisItems, then turns it into the SequencingRunItem which will be
 * used to generate more data.
 * @param genericMolecularAnalysisItem
 * @returns The initial structure of SequencingRunItem.
 */
export function attachGenericMolecularAnalysisItems(
  genericMolecularAnalysisItem: PersistedResource<GenericMolecularAnalysisItem>[]
): SequencingRunItem[] {
  return genericMolecularAnalysisItem.map<SequencingRunItem>((item) => ({
    molecularAnalysisItem: item,
    molecularAnalysisItemId: item.id,
    molecularAnalysisRunItem: item?.molecularAnalysisRunItem,
    molecularAnalysisRunItemId: item?.molecularAnalysisRunItem?.id,
    storageUnitUsageId: item?.storageUnitUsage?.id,
    materialSampleId: item?.materialSample?.id
  }));
}
