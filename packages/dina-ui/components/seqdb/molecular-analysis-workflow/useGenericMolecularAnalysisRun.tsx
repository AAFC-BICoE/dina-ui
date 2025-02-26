import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { filterBy, SaveArgs, useApiClient, useQuery } from "common-ui";
import { StorageUnitUsage } from "packages/dina-ui/types/collection-api/resources/StorageUnitUsage";
import { PersistedResource } from "kitsu";
import { MaterialSampleSummary } from "packages/dina-ui/types/collection-api";
import { useDinaIntl } from "../../../intl/dina-ui-intl";
import { GenericMolecularAnalysisItem } from "packages/dina-ui/types/seqdb-api/resources/GenericMolecularAnalysisItem";
import { GenericMolecularAnalysis } from "packages/dina-ui/types/seqdb-api/resources/GenericMolecularAnalysis";
import {
  MolecularAnalysisRunItem,
  MolecularAnalysisRunItemUsageType
} from "../../../types/seqdb-api/resources/molecular-analysis/MolecularAnalysisRunItem";
import { MolecularAnalysisRun } from "packages/dina-ui/types/seqdb-api/resources/molecular-analysis/MolecularAnalysisRun";
import { ResourceIdentifierObject } from "jsonapi-typescript";
import { QualityControl } from "packages/dina-ui/types/seqdb-api/resources/QualityControl";
import useVocabularyOptions from "../../collection/useVocabularyOptions";
import { VocabularyOption } from "../../collection/VocabularySelectField";
import { isEqual } from "lodash";
import { MolecularAnalysisResult } from "packages/dina-ui/types/seqdb-api/resources/molecular-analysis/MolecularAnalysisResult";
import { Metadata } from "packages/dina-ui/types/objectstore-api";

export interface QualityControlWithAttachment extends QualityControl {
  attachments: ResourceIdentifierObject[];
}

export interface UseGenericMolecularAnalysisRunProps {
  molecularAnalysis: GenericMolecularAnalysis;
  molecularAnalysisId: string;
  editMode: boolean;
  setEditMode: (newValue: boolean) => void;
  performSave: boolean;
  setPerformSave: (newValue: boolean) => void;
  onSaved?: (
    nextStep: number,
    molecularAnalysisSaved?: PersistedResource<GenericMolecularAnalysis>
  ) => Promise<void>;
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
   * in. This special type extends the existing quality control and adds the attachment field for
   * each quality control.
   */
  qualityControls: QualityControlWithAttachment[];

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
   * @param {QualityControlWithAttachment} newQualityControl - The new quality control object to replace the old one.
   */
  updateQualityControl: (
    index: number,
    newQualityControl: QualityControlWithAttachment
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

  /**
   * Callback to set the molecular analysis run item names
   */
  setMolecularAnalysisRunItemNames?: Dispatch<
    SetStateAction<Record<string, string>>
  >;

  setReloadGenericMolecularAnalysisRun: Dispatch<SetStateAction<number>>;
}

export function useGenericMolecularAnalysisRun({
  molecularAnalysisId,
  molecularAnalysis,
  editMode,
  setEditMode,
  performSave,
  setPerformSave,
  onSaved
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
  const [qualityControls, setQualityControls] = useState<
    QualityControlWithAttachment[]
  >([]);
  const [loadedQualityControls, setLoadedQualityControls] = useState<
    QualityControlWithAttachment[]
  >([]);

  // Sequencing run attachments
  const [attachments, setAttachments] = useState<ResourceIdentifierObject[]>(
    []
  );
  // Used to determine if the resource needs to be reloaded.
  const [
    reloadGenericMolecularAnalysisRun,
    setReloadGenericMolecularAnalysisRun
  ] = useState<number>(Date.now());

  // Map of MolecularAnalysisRunItem {materialSampleId:name}
  const [molecularAnalysisRunItemNames, setMolecularAnalysisRunItemNames] =
    useState<Record<string, string>>({});

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
        "storageUnitUsage,materialSample,molecularAnalysisRunItem,molecularAnalysisRunItem.run,molecularAnalysisRunItem.result,molecularAnalysisRunItem.result"
    },
    {
      deps: [reloadGenericMolecularAnalysisRun],
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

        async function attachMolecularAnalysisRunItemResult(
          sequencingRunItem: SequencingRunItem[]
        ): Promise<SequencingRunItem[]> {
          const molecularAnalysisResultPaths = sequencingRunItem
            .filter((item) => item?.molecularAnalysisRunItem?.result?.id)
            .map(
              (item) =>
                `/molecular-analysis-result/${item?.molecularAnalysisRunItem?.result?.id}?include=attachments`
            );
          const molecularAnalysisResultQuery =
            await bulkGet<MolecularAnalysisResult>(
              molecularAnalysisResultPaths,
              { apiBaseUrl: "/seqdb-api" }
            );
          if (molecularAnalysisResultQuery.length > 0) {
            for (const molecularAnalysisResult of molecularAnalysisResultQuery) {
              const resultAttachmentsQuery = await bulkGet<Metadata>(
                molecularAnalysisResult?.attachments.map(
                  (attachment) => `/metadata/${attachment?.id}`
                ),
                { apiBaseUrl: "/objectstore-api" }
              );
              molecularAnalysisResult.attachments = resultAttachmentsQuery;
            }
          }

          return sequencingRunItem.map((runItem) => {
            const queryMolecularAnalysisResult =
              molecularAnalysisResultQuery.find(
                (molecularAnalysisResult) =>
                  molecularAnalysisResult?.id ===
                  runItem?.molecularAnalysisRunItem?.result?.id
              );
            if (runItem.molecularAnalysisRunItem?.result) {
              runItem.molecularAnalysisRunItem.result =
                queryMolecularAnalysisResult;
            }

            return {
              ...runItem
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
            await retrieveQualityControls(firstSequencingRun);
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

        try {
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
          sequencingRunItemsChain = await attachMolecularAnalysisRunItemResult(
            sequencingRunItemsChain
          );
          await findMolecularAnalysisRun(sequencingRunItemsChain);

          // All finished loading.
          setSequencingRunItems(sequencingRunItemsChain);
          setLoading(false);
        } catch (error) {
          console.error(error);
        } finally {
          setLoading(false);
        }
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
  function createNewQualityControl(name?: string) {
    setQualityControls((qualityControls) => [
      ...qualityControls,
      {
        group: "",
        name: name ?? "",
        qcType: "",
        type: MolecularAnalysisRunItemUsageType.QUALITY_CONTROL,
        attachments: []
      }
    ]);
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

  /**
   * Updates an existing quality control at the specified index with a new quality control object.
   *
   * @param {number} index - The index of the quality control to be updated.
   * @param {QualityControlWithAttachment} newQualityControl - The new quality control object to replace the old one.
   */
  function updateQualityControl(
    index: number,
    newQualityControl: QualityControlWithAttachment
  ) {
    // Create a copy of the existing quality controls array
    const updatedQualityControls = [...qualityControls];

    // Update the quality control at the specified index with the new one
    updatedQualityControls[index] = newQualityControl;

    // Update the state with the modified array
    setQualityControls(updatedQualityControls);
  }

  /**
   * Goes through the quality controls array and removes any quality controls that do not contain
   * a name or a type.
   */
  function removeEmptyQualityControls() {
    // Filter out blank quality controls (missing name or qcType)
    const validatedQualityControls = qualityControls.filter(
      (qualityControl) =>
        !(qualityControl.name === "" && qualityControl.qcType === "")
    );

    // Update the state with the validated array
    setQualityControls(validatedQualityControls);
  }

  /**
   * Go through the array and if any quality controls only contain a name or a type (both need to
   * be supplied for it to be considered valid) then return not valid.
   *
   * @returns true if valid, false otherwise.
   */
  function validateQualityControls(): boolean {
    const invalidQualityControl = qualityControls.find(
      (qualityControl) =>
        (qualityControl.name === "" && qualityControl.qcType !== "") ||
        (qualityControl.name !== "" && qualityControl.qcType === "")
    );

    if (invalidQualityControl) {
      return false;
    } else {
      return true;
    }
  }

  async function retrieveQualityControls(run: MolecularAnalysisRun) {
    // Only perform the request if a sequencing run exists.
    if (run?.id) {
      const qualityControlItemQuery = await apiClient.get(
        `seqdb-api/molecular-analysis-run-item`,
        {
          filter: filterBy([], {
            extraFilters: [
              {
                selector: "run.uuid",
                comparison: "==",
                arguments: run?.id
              },
              {
                selector: "usageType",
                comparison: "==",
                arguments: MolecularAnalysisRunItemUsageType.QUALITY_CONTROL
              }
            ]
          })("")
        }
      );

      if (
        qualityControlItemQuery &&
        (qualityControlItemQuery as any)?.data?.length > 0
      ) {
        const newQualityControls: QualityControlWithAttachment[] = [];

        // Go through each quality control run item and then we do a query for each quality control.
        const qualityControlRunItems = (qualityControlItemQuery as any)?.data;
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
              include:
                "molecularAnalysisRunItem,molecularAnalysisRunItem.result"
            }
          );

          const qualityControlFound = qualityControlQuery
            ?.data?.[0] as QualityControlWithAttachment;
          if (qualityControlFound) {
            // If a result exists, we need to perform a get request to retrieve the metadata to be displayed.
            let attachments: ResourceIdentifierObject[] = [];
            if (qualityControlFound.molecularAnalysisRunItem?.result?.id) {
              const molecularAnalysisResultQuery =
                await apiClient.get<MolecularAnalysisResult>(
                  `seqdb-api/molecular-analysis-result/${qualityControlFound.molecularAnalysisRunItem?.result?.id}`,
                  {
                    include: "attachments"
                  }
                );
              if (molecularAnalysisResultQuery?.data?.attachments) {
                attachments = molecularAnalysisResultQuery.data
                  .attachments as ResourceIdentifierObject[];
              }
            }

            newQualityControls.push({
              ...qualityControlFound,
              attachments: attachments ?? []
            });
          }
        }

        setQualityControls(newQualityControls);
        setLoadedQualityControls(newQualityControls);
      }
    }
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
        sequencingRunItems.map((item) => {
          const molecularAnalysisRunItemName = item.materialSampleSummary?.id
            ? molecularAnalysisRunItemNames[item.materialSampleSummary?.id]
            : undefined;
          return {
            type: "molecular-analysis-run-item",
            resource: {
              type: "molecular-analysis-run-item",
              usageType:
                MolecularAnalysisRunItemUsageType.GENERIC_MOLECULAR_ANALYSIS_ITEM,
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
            }
          };
        });
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

      // Create a run item for each quality control linked to the same run that was created.
      const qualityControlRunItemSaveArgs: SaveArgs<MolecularAnalysisRunItem>[] =
        qualityControls.map(() => ({
          type: "molecular-analysis-run-item",
          resource: {
            type: "molecular-analysis-run-item",
            usageType: MolecularAnalysisRunItemUsageType.QUALITY_CONTROL,
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
      const savedQualityControlRunItem = await save(
        qualityControlRunItemSaveArgs,
        { apiBaseUrl: "/seqdb-api" }
      );

      // Create the quality control entities, and link to the run items above.
      const qualityControlSaveArgs: SaveArgs<QualityControl>[] =
        qualityControls.map((item, index) => ({
          type: "quality-control",
          resource: {
            type: "quality-control",
            group: groupName,
            name: item.name,
            qcType: item.qcType,
            relationships: {
              molecularAnalysisRunItem: {
                data: {
                  id: savedQualityControlRunItem[index].id,
                  type: "molecular-analysis-run-item"
                }
              }
            }
          }
        }));
      const savedQualityControls = await save(qualityControlSaveArgs, {
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

      // Update the quality controls state.
      setQualityControls(
        savedQualityControls as QualityControlWithAttachment[]
      );
      setLoadedQualityControls(
        savedQualityControls as QualityControlWithAttachment[]
      );

      // Go back to view mode once completed.
      setPerformSave(false);
      setEditMode(false);
      setLoading(false);

      await onSaved?.(4);
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

      // Update existing MolecularAnalysisRunItem names
      if (sequencingRunItems) {
        const molecularAnalysisRunItemSaveArgs: SaveArgs<MolecularAnalysisRunItem>[] =
          [];
        sequencingRunItems.forEach((item) => {
          const molecularAnalysisRunItemName = item.materialSampleSummary?.id
            ? molecularAnalysisRunItemNames[item.materialSampleSummary?.id]
            : undefined;
          molecularAnalysisRunItemSaveArgs.push({
            type: "molecular-analysis-run-item",
            resource: {
              id: item.molecularAnalysisRunItemId,
              type: "molecular-analysis-run-item",
              name: molecularAnalysisRunItemName
            }
          });
        });
        if (molecularAnalysisRunItemSaveArgs.length) {
          await save(molecularAnalysisRunItemSaveArgs, {
            apiBaseUrl: "/seqdb-api"
          });
        }
      }

      // Check if the quality controls loaded in match the current one, if it's different then we
      // need to update the quality controls.
      if (!isEqual(qualityControls, loadedQualityControls)) {
        // Create new items for anything with no id...
        const qualityControlsWithoutId = qualityControls.filter(
          (qc) => !qc.id && qc.name && qc.type
        );
        if (qualityControlsWithoutId.length > 0) {
          // Create a molecular analysis result if an attachment exists.
          const qualityControlResultSaveArgs: SaveArgs<MolecularAnalysisResult>[] =
            qualityControlsWithoutId
              .map((qualityControl) => {
                if (qualityControl.attachments.length !== 0) {
                  return {
                    type: "molecular-analysis-result",
                    resource: {
                      type: "molecular-analysis-result",
                      group: sequencingRun.group,
                      relationships: {
                        attachments: {
                          data: qualityControl.attachments
                        }
                      }
                    }
                  };
                } else {
                  return null;
                }
              })
              .filter(
                (saveArgs) => saveArgs !== null
              ) as SaveArgs<MolecularAnalysisResult>[];

          const savedQualityControlResults =
            qualityControlResultSaveArgs.length > 0
              ? await save(qualityControlResultSaveArgs, {
                  apiBaseUrl: "/seqdb-api"
                })
              : [];

          // Create a run item for each quality control linked to the same run that was created.
          const qualityControlRunItemSaveArgs: SaveArgs<MolecularAnalysisRunItem>[] =
            [];
          let resultIndex = 0;
          qualityControlsWithoutId.forEach((qualityControl) => {
            const runItem = {
              type: "molecular-analysis-run-item",
              resource: {
                type: "molecular-analysis-run-item",
                usageType: MolecularAnalysisRunItemUsageType.QUALITY_CONTROL,
                relationships: {
                  result: {
                    data: {
                      id: "",
                      type: "molecular-analysis-result"
                    }
                  },
                  run: {
                    data: {
                      id: sequencingRun.id,
                      type: "molecular-analysis-run"
                    }
                  }
                }
              }
            } as any;

            if (qualityControl.attachments.length !== 0) {
              // Attachments exist. Link the ID to the result created above.
              runItem.resource.relationships.result.data.id =
                savedQualityControlResults[resultIndex].id;
              resultIndex++;
            } else {
              // No attachments, no result needed.
              delete runItem.resource.relationships.result;
            }

            qualityControlRunItemSaveArgs.push(runItem);
          });
          const savedQualityControlRunItem = await save(
            qualityControlRunItemSaveArgs,
            { apiBaseUrl: "/seqdb-api" }
          );

          // Create the quality control entities, and link to the run items above.
          const qualityControlSaveArgs: SaveArgs<QualityControl>[] =
            qualityControlsWithoutId.map((item, index) => ({
              type: "quality-control",
              resource: {
                type: "quality-control",
                group: sequencingRun.group,
                name: item.name,
                qcType: item.qcType,
                relationships: {
                  molecularAnalysisRunItem: {
                    data: {
                      id: savedQualityControlRunItem[index].id,
                      type: "molecular-analysis-run-item"
                    }
                  }
                }
              }
            }));
          await save(qualityControlSaveArgs, {
            apiBaseUrl: "/seqdb-api"
          });
        }

        // Update existing quality control entities.
        const updatedQualityControls = qualityControls.filter((qc) => {
          const matchingLoadedQc = loadedQualityControls.find(
            (loadedQc) => loadedQc.id === qc.id
          );
          return (
            qc.id &&
            qc.name &&
            qc.type &&
            matchingLoadedQc &&
            (qc.name !== matchingLoadedQc.name ||
              qc.type !== matchingLoadedQc.type)
          );
        });
        if (updatedQualityControls.length > 0) {
          // Update quality control entity.
          const qualityControlUpdateArgs: SaveArgs<QualityControl>[] =
            updatedQualityControls.map((item) => ({
              type: "quality-control",
              id: item.id,
              resource: {
                id: item.id,
                type: "quality-control",
                group: sequencingRun.group,
                name: item.name,
                qcType: item.qcType
              }
            }));
          await save(qualityControlUpdateArgs, {
            apiBaseUrl: "/seqdb-api"
          });
        }

        // Delete quality controls that no longer exist in the qualityControls but exist in the loadedQualityControls.
        const deletedQualityControls = loadedQualityControls.filter(
          (loadedQc) => !qualityControls.some((qc) => qc.id === loadedQc.id)
        );
        if (deletedQualityControls.length > 0) {
          // Delete quality control.
          await save(
            deletedQualityControls.map((item) => ({
              delete: {
                id: item?.id ?? "",
                type: "quality-control"
              }
            })),
            { apiBaseUrl: "/seqdb-api" }
          );

          // Delete run items.
          await save(
            deletedQualityControls.map((item) => ({
              delete: {
                id: item?.molecularAnalysisRunItem?.id ?? "",
                type: "molecular-analysis-run-item"
              }
            })),
            { apiBaseUrl: "/seqdb-api" }
          );
        }

        // Reload the quality controls...
        await retrieveQualityControls(sequencingRun);
      }

      // Go back to view mode once completed.
      setPerformSave(false);
      setEditMode(false);
      setLoading(false);
      setReloadGenericMolecularAnalysisRun(Date.now());
      await onSaved?.(4);
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

      // Remove empty options from the quality control.
      removeEmptyQualityControls();

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

      // Ensure quality controls are valid.
      if (!validateQualityControls()) {
        setPerformSave(false);
        setLoading(false);
        setErrorMessage(
          "Please ensure all quality controls have both a name and type."
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
    sequencingRunId: sequencingRun?.id,
    setMolecularAnalysisRunItemNames,
    setReloadGenericMolecularAnalysisRun
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
