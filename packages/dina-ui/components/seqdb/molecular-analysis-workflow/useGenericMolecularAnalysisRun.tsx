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
import _ from "lodash";
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
  skipAutoEditMode?: boolean;
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

  setSequencingRunItems?: Dispatch<
    SetStateAction<SequencingRunItem[] | undefined>
  >;

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
  createNewQualityControl: (name?: string, qcType?: string) => void;

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
  setMolecularAnalysisRunItemNames: Dispatch<
    SetStateAction<Record<string, string>>
  >;

  /**
   * Used to force a refresh of the data outside of this hook.
   */
  setReloadGenericMolecularAnalysisRun: Dispatch<SetStateAction<number>>;

  updateExistingQualityControls: (
    updatedQualityControlsCopy?: QualityControlWithAttachment[]
  ) => Promise<void>;
}

export function useGenericMolecularAnalysisRun({
  molecularAnalysisId,
  molecularAnalysis,
  editMode,
  setEditMode,
  performSave,
  setPerformSave,
  onSaved,
  skipAutoEditMode = false
}: UseGenericMolecularAnalysisRunProps): UseGenericMolecularAnalysisRunReturn {
  const { bulkGet, save, apiClient } = useApiClient();
  const { formatMessage } = useDinaIntl();

  // Used to display if the network calls are still in progress.
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>();
  const [automaticEditMode, setAutomaticEditMode] =
    useState<boolean>(skipAutoEditMode);
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
      deps: [reloadGenericMolecularAnalysisRun, editMode],
      onSuccess: async ({ data: genericMolecularAnalysisItems }) => {
        // No need to reload if going between readonly to edit. Same data.
        if (editMode === true && sequencingRunName !== undefined) {
          return;
        }

        // Reset all states to be empty.
        setLoading(true);
        setSequencingRunName(undefined);
        setSequencingRunItems(undefined);
        setQualityControls([]);
        setLoadedQualityControls([]);
        setAttachments([]);
        setErrorMessage(undefined);

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
              .map(
                (item) =>
                  "/storage-unit-usage/" +
                  item?.storageUnitUsageId +
                  "?optfields[storage-unit-usage]=cellNumber"
              ),
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

  /**
   * Creates a new quality control object and adds it to the existing quality controls list.
   */
  function createNewQualityControl(name?: string, qcType?: string) {
    setQualityControls((qualityControls) => [
      ...qualityControls,
      {
        group: "",
        name: name ?? "",
        qcType: qcType ?? "",
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
    setQualityControls((prev) => {
      // Create a copy of the existing quality controls array
      const updatedQualityControls = [...prev];
      // Update the quality control at the specified index with the new one
      updatedQualityControls[index] = newQualityControl;
      return updatedQualityControls;
    });
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

            const attachmentMetadatas = await bulkGet<Metadata>(
              attachments.map((attachment) => `metadata/${attachment.id}`),
              {
                apiBaseUrl: "objectstore-api"
              }
            );

            newQualityControls.push({
              ...qualityControlFound,
              attachments:
                _.compact(attachmentMetadatas).length === attachments.length
                  ? (attachmentMetadatas as ResourceIdentifierObject[])
                  : attachments ?? []
            });
          }
        }

        setQualityControls(newQualityControls);
        setLoadedQualityControls(newQualityControls);
      }
    }
  }

  /**
   * Compare the difference between two sets of attachment arrays to determine if it has changed.
   *
   * @param attachments1 attachment set 1
   * @param attachments2 attachment set 2
   * @returns {boolean} true if different, false otherwise.
   */
  function hasAttachmentsChanged(
    attachments1: ResourceIdentifierObject[],
    attachments2: ResourceIdentifierObject[]
  ): boolean {
    // Both do not contain attachments, no changes.
    if (!attachments1 && !attachments2) {
      return false;
    }

    // Length or one is undefined/null, changes made.
    if (
      !attachments1 ||
      !attachments2 ||
      attachments1.length !== attachments2.length
    ) {
      return true;
    }

    // Final case is same length but different ids.
    const ids1 = attachments1.map((a) => a.id).sort();
    const ids2 = attachments2.map((a) => a.id).sort();
    return !_.isEqual(ids1, ids2);
  }

  /**
   * Performs the molecular analysis run saving/creation. Operation is only made if changes are made
   * from the loaded in molecular analysis run.
   *
   * @returns Saved/Updated resource uuid. If not changes are made, the existing uuid is returned.
   */
  async function performMolecularAnalysisRunSave(): Promise<string> {
    const attachmentsChanged = hasAttachmentsChanged(
      attachments,
      sequencingRun?.attachments ?? []
    );

    // Perform only does not contain id (new) or if something has changed.
    if (
      !sequencingRun?.id ||
      sequencingRunName !== sequencingRun.name ||
      attachmentsChanged
    ) {
      const molecularAnalysisRunSaveArg: SaveArgs<MolecularAnalysisRun>[] = [
        {
          type: "molecular-analysis-run",
          ...(sequencingRun ? { id: sequencingRun.id } : {}),
          resource: {
            type: "molecular-analysis-run",
            ...(sequencingRun ? { id: sequencingRun.id } : {}),
            ...(sequencingRunName !== sequencingRun?.name
              ? { name: sequencingRunName }
              : {}),
            ...(!sequencingRun ? { group: molecularAnalysis.group } : {}),
            ...(attachmentsChanged && {
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
        { apiBaseUrl: "/seqdb-api" }
      );

      return savedMolecularAnalysisRun[0].id;
    }

    // No operation performed, just return the existing id.
    return sequencingRun.id;
  }

  /**
   * Performs the molecular analysis run item saving/creation. Operation is only made if changes
   * are made from the loaded in molecular analysis run items.
   *
   * @param molecularAnalysisRunId uuid for the molecular analyis run.
   */
  async function performMolecularAnalysisRunItemSave(
    molecularAnalysisRunId: string
  ) {
    if (sequencingRunItems) {
      const molecularAnalysisRunItemSaveArgs: SaveArgs<MolecularAnalysisRunItem>[] =
        sequencingRunItems
          .map((item) => {
            const sampleId = item.materialSampleSummary?.id;
            const molecularAnalysisRunItemName = sampleId
              ? molecularAnalysisRunItemNames[sampleId]
              : undefined;

            const resource = {
              type: "molecular-analysis-run-item",
              ...(item.molecularAnalysisRunItemId
                ? { id: item.molecularAnalysisRunItemId }
                : {}),

              // Only include this on creation, these cannot be changed on updates.
              ...(!item.molecularAnalysisRunItemId
                ? {
                    usageType:
                      MolecularAnalysisRunItemUsageType.GENERIC_MOLECULAR_ANALYSIS_ITEM,
                    relationships: {
                      run: {
                        data: {
                          id: molecularAnalysisRunId,
                          type: "molecular-analysis-run"
                        }
                      }
                    }
                  }
                : {}),

              // Run item name is likely the thing that has changed.
              ...(sampleId &&
                sampleId in molecularAnalysisRunItemNames && {
                  name: molecularAnalysisRunItemName
                })
            } as any;

            // Check if the resource only contains the id and type.
            const isOnlyIdAndType =
              Object.keys(resource).length === 2 &&
              resource.id &&
              resource.type;
            if (isOnlyIdAndType) {
              return null;
            }

            return {
              type: "molecular-analysis-run-item",
              ...(item.molecularAnalysisRunItemId
                ? { id: item.molecularAnalysisRunItemId }
                : {}),
              resource
            };
          })
          .filter(
            (item): item is SaveArgs<MolecularAnalysisRunItem> => item !== null
          );

      // Check if any updates are required.
      if (molecularAnalysisRunItemSaveArgs.length !== 0) {
        const savedMolecularAnalysisRunItem = await save(
          molecularAnalysisRunItemSaveArgs,
          { apiBaseUrl: "/seqdb-api" }
        );

        // Update the current sequencing run items to include the new run items.
        const sequencingRunItemsToSave = sequencingRunItems.map(
          (item, index) => ({
            ...item,
            molecularAnalysisRunItemId:
              savedMolecularAnalysisRunItem?.[index]?.id,
            molecularAnalysisRunItem: savedMolecularAnalysisRunItem?.[
              index
            ] as MolecularAnalysisRunItem
          })
        );
        setSequencingRunItems(sequencingRunItemsToSave);

        // Update the existing seq-reactions to attach the run items created.
        if (!sequencingRun?.id) {
          const genericMolecularAnalysisItemSaveArgs: SaveArgs<GenericMolecularAnalysisItem>[] =
            sequencingRunItems.map((item, index) => ({
              type: "generic-molecular-analysis-item",
              ...(item.molecularAnalysisItemId
                ? { id: item.molecularAnalysisItemId }
                : {}),
              resource: {
                type: "generic-molecular-analysis-item",
                ...(item.molecularAnalysisItemId
                  ? { id: item.molecularAnalysisItemId }
                  : {}),
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
        }
      }
    }
  }

  /**
   * Creates new quality control entities, their associated run items, and results (if attachments are present).
   *
   * This function processes quality controls that do not yet have an ID, indicating they are newly added.
   *
   * It performs the following steps:
   *
   * 1. Filters the provided `qualityControls` array to identify new quality controls (those without an 'id').
   * 2. For each new quality control with attachments, it creates a `MolecularAnalysisResult` entity to store attachment information.
   * 3. Creates `MolecularAnalysisRunItem` entities for each new quality control, linking them to the specified `molecularAnalysisRunId` and associating them with the created `MolecularAnalysisResult` if attachments are present.
   * 4. Creates `QualityControl` entities, linking them to the newly created `MolecularAnalysisRunItem` entities.
   * 5. Updates the component state with the newly created quality controls using `setQualityControls` and `setLoadedQualityControls`.
   *
   * @param {string} molecularAnalysisRunId - The ID of the MolecularAnalysisRun to which these quality controls belong.
   */
  async function createNewQualityControls(molecularAnalysisRunId: string) {
    const groupName = molecularAnalysis.group;

    if (!_.isEqual(qualityControls, loadedQualityControls)) {
      const qualityControlsWithoutId = qualityControls.filter(
        (qc) => !qc.id && qc.name && qc.type
      );

      if (qualityControlsWithoutId.length === 0) {
        // No quality controls to be created.
        return;
      }

      // Create MolecularAnalysisResults for new QualityControls with attachments
      const qualityControlResultSaveArgs: SaveArgs<MolecularAnalysisResult>[] =
        qualityControlsWithoutId
          .map((qualityControl) => {
            if (qualityControl?.attachments?.length !== 0) {
              return {
                type: "molecular-analysis-result",
                resource: {
                  type: "molecular-analysis-result",
                  group: groupName,
                  relationships: {
                    attachments: { data: qualityControl.attachments }
                  }
                }
              } as SaveArgs<MolecularAnalysisResult>;
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

      // Create MolecularAnalysisRunItems for new QualityControls
      const qualityControlRunItemSaveArgs: SaveArgs<MolecularAnalysisRunItem>[] =
        [];
      let resultIndex = 0;
      qualityControlsWithoutId.forEach((qualityControl) => {
        const runItem: SaveArgs<MolecularAnalysisRunItem> = {
          type: "molecular-analysis-run-item",
          resource: {
            type: "molecular-analysis-run-item",
            usageType: MolecularAnalysisRunItemUsageType.QUALITY_CONTROL,
            relationships: {
              run: {
                data: {
                  id: molecularAnalysisRunId,
                  type: "molecular-analysis-run"
                }
              },
              ...(qualityControl?.attachments?.length !== 0 && {
                result: {
                  data: { id: "", type: "molecular-analysis-result" }
                }
              })
            }
          } as any
        };

        // Inject the id for the result relationship if attachments exist.
        if (qualityControl?.attachments?.length !== 0) {
          (runItem as any).resource.relationships.result.data.id =
            savedQualityControlResults[resultIndex].id;
          resultIndex++;
        }

        qualityControlRunItemSaveArgs.push(runItem);
      });
      const savedQualityControlRunItem = await save(
        qualityControlRunItemSaveArgs,
        { apiBaseUrl: "/seqdb-api" }
      );

      // Create QualityControls (linking to MolecularAnalysisRunItems)
      const qualityControlSaveArgs: SaveArgs<QualityControl>[] =
        qualityControlsWithoutId.map((item, index) => ({
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

      // Updated quality controls
      setQualityControls(
        savedQualityControls as QualityControlWithAttachment[]
      );
      setLoadedQualityControls(
        savedQualityControls as QualityControlWithAttachment[]
      );
    }
  }

  /**
   * Updates existing quality control entities if changes are detected and manages associated
   * MolecularAnalysisResults based on attachment changes.
   *
   * This function compares the current `qualityControls` against the `loadedQualityControls` to
   * identify updates to existing quality controls (those with an 'id').
   *
   * It performs the following steps for each updated quality control:
   * 1. Checks if the quality control's name or type has changed. If so, it updates the `QualityControl` entity.
   * 2. Determines if the attachments associated with the quality control have changed by comparing the current attachments to the loaded attachments.
   * 3. Based on the attachment change scenario, it manages the linked `MolecularAnalysisResult` entity:
   *    - Case 1: Attachments Added (No Previous Attachments):
   *              Creates a new `MolecularAnalysisResult` entity and links it to the corresponding
   *              `MolecularAnalysisRunItem`.
   *    - Case 2: All Attachments Removed:
   *              Deletes the existing `MolecularAnalysisResult` entity and unlinks it from the
   *              `MolecularAnalysisRunItem`.
   *    - Case 3: Attachments Added/Changed (Previous Result Exists): Updates the existing
   *              `MolecularAnalysisResult` entity with the new attachments.
   */
  async function updateExistingQualityControls(
    updatedQualityControlsCopy?: QualityControlWithAttachment[]
  ) {
    const groupName = molecularAnalysis.group;

    const sourceQualityControls = updatedQualityControlsCopy ?? qualityControls;

    // Determine which quality controls need to be updated
    const updatedQualityControls = sourceQualityControls.filter((qc) => {
      const matchingLoadedQc = loadedQualityControls.find(
        (loadedQc) => loadedQc.id === qc.id
      );

      if (!matchingLoadedQc) {
        return false;
      }

      const hasNameOrTypeChanged =
        qc.name !== matchingLoadedQc.name || qc.type !== matchingLoadedQc.type;

      return (
        qc.id &&
        qc.name &&
        qc.type &&
        (hasNameOrTypeChanged ||
          hasAttachmentsChanged(qc.attachments, matchingLoadedQc.attachments))
      );
    });

    if (updatedQualityControls.length === 0) {
      return; // Nothing to update
    }

    const qualityControlUpdateArgs: SaveArgs<QualityControl>[] =
      updatedQualityControls
        .map((item) => {
          const matchingLoadedQc = loadedQualityControls.find(
            (loadedQc) => loadedQc.id === item.id
          );

          const resource = {
            id: item.id,
            type: "quality-control",
            ...(matchingLoadedQc?.name !== item.name
              ? { name: item.name }
              : {}),
            ...(matchingLoadedQc?.qcType !== item.qcType
              ? { qcType: item.qcType }
              : {})
          };

          const isOnlyIdAndType =
            Object.keys(resource).length === 2 && resource.id && resource.type;

          if (isOnlyIdAndType) {
            return null;
          }

          return {
            type: "quality-control",
            id: item.id,
            resource
          } as SaveArgs<QualityControl>;
        })
        .filter((item): item is SaveArgs<QualityControl> => item !== null);

    if (qualityControlUpdateArgs.length > 0) {
      await save(qualityControlUpdateArgs, { apiBaseUrl: "/seqdb-api" });
    }

    // Handle MolecularAnalysisResult updates
    for (const qc of updatedQualityControls) {
      const matchingLoadedQc = loadedQualityControls.find(
        (loadedQc) => loadedQc.id === qc.id
      )!;
      const loadedAttachments = matchingLoadedQc.attachments || [];
      const currentAttachments = qc.attachments || [];

      const hasAttachmentChange = hasAttachmentsChanged(
        qc.attachments,
        matchingLoadedQc.attachments
      );

      if (!hasAttachmentChange) continue;

      if (currentAttachments.length > 0 && loadedAttachments.length === 0) {
        // Case 1: Create new result and link it
        const resultSaveArgs: SaveArgs<MolecularAnalysisResult>[] = [
          {
            type: "molecular-analysis-result",
            resource: {
              type: "molecular-analysis-result",
              group: groupName,
              relationships: {
                attachments: { data: currentAttachments }
              }
            }
          } as any
        ];
        const savedResults = await save(resultSaveArgs, {
          apiBaseUrl: "/seqdb-api"
        });
        const savedResult = savedResults[0];

        const runItemUpdateArgs: SaveArgs<MolecularAnalysisRunItem>[] = [
          {
            type: "molecular-analysis-run-item",
            id: matchingLoadedQc?.molecularAnalysisRunItem?.id,
            resource: {
              id: matchingLoadedQc?.molecularAnalysisRunItem?.id,
              type: "molecular-analysis-run-item",
              relationships: {
                result: {
                  data: {
                    id: savedResult.id,
                    type: "molecular-analysis-result"
                  }
                }
              }
            }
          } as any
        ];
        await save(runItemUpdateArgs, { apiBaseUrl: "/seqdb-api" });
      } else if (
        currentAttachments.length === 0 &&
        loadedAttachments.length > 0
      ) {
        // Case 2: Delete result and unlink
        const resultIdToDelete = (matchingLoadedQc as any)
          .molecularAnalysisRunItem?.result?.id;

        if (resultIdToDelete) {
          const unlinkRunItemArgs: SaveArgs<MolecularAnalysisRunItem>[] = [
            {
              type: "molecular-analysis-run-item",
              id: matchingLoadedQc?.molecularAnalysisRunItem?.id,
              resource: {
                id: matchingLoadedQc?.molecularAnalysisRunItem?.id,
                type: "molecular-analysis-run-item",
                relationships: { result: { data: null } }
              }
            } as any
          ];
          await save(unlinkRunItemArgs, { apiBaseUrl: "/seqdb-api" });

          await save(
            [
              {
                delete: {
                  id: resultIdToDelete,
                  type: "molecular-analysis-result"
                }
              }
            ],
            { apiBaseUrl: "/seqdb-api" }
          );
        }
      } else {
        // Case 3: Update existing result
        const resultIdToUpdate = (matchingLoadedQc as any)
          .molecularAnalysisRunItem?.result?.id;

        if (resultIdToUpdate) {
          const updateArgs: SaveArgs<MolecularAnalysisResult>[] = [
            {
              type: "molecular-analysis-result",
              id: resultIdToUpdate,
              resource: {
                id: resultIdToUpdate,
                type: "molecular-analysis-result",
                relationships: {
                  attachments: { data: currentAttachments }
                }
              }
            } as any
          ];
          await save(updateArgs, { apiBaseUrl: "/seqdb-api" });
        }
      }
    }
  }

  /**
   * Deletes quality control entities that have been removed from the current list of quality controls.
   *
   * This function identifies quality controls that are present in the `loadedQualityControls` but
   * not in the current `qualityControls` array, indicating they have been removed by the user.
   *
   * It performs a cascading delete operation, removing related entities in the following order:
   *
   * 1. QualityControl
   * 2. MolecularAnalysisRunItems
   * 3. MolecularAnalysisResults (Conditional if attachments exist.)
   *
   */
  async function deleteRemovedQualityControls() {
    // Delete quality controls that are removed
    const deletedQualityControls = loadedQualityControls.filter(
      (loadedQc) => !qualityControls.some((qc) => qc.id === loadedQc.id)
    );

    if (deletedQualityControls.length === 0) {
      // Nothing to delete.
      return;
    }

    await save(
      deletedQualityControls.map((item) => ({
        delete: { id: item?.id ?? "", type: "quality-control" }
      })),
      { apiBaseUrl: "/seqdb-api" }
    );

    await save(
      deletedQualityControls.map((item) => ({
        delete: {
          id: item?.molecularAnalysisRunItem?.id ?? "",
          type: "molecular-analysis-run-item"
        }
      })),
      { apiBaseUrl: "/seqdb-api" }
    );

    // Delete molecular analysis results if attachments existed.
    const resultsToDelete = deletedQualityControls.filter(
      (item) =>
        item.attachments &&
        item.attachments.length > 0 &&
        item?.molecularAnalysisRunItem?.result?.id
    );
    if (resultsToDelete.length > 0) {
      await save(
        resultsToDelete.map((item) => {
          return {
            delete: {
              id: item?.molecularAnalysisRunItem?.result?.id ?? "",
              type: "molecular-analysis-result"
            }
          };
        }),
        { apiBaseUrl: "/seqdb-api" }
      );
    }
  }

  async function saveSequencingRun() {
    if (
      !sequencingRunItems ||
      !molecularAnalysis ||
      sequencingRunItems.length === 0
    ) {
      return;
    }

    setLoading(true);
    setErrorMessage(undefined);
    setPerformSave(false);

    // Remove empty options from the quality control.
    removeEmptyQualityControls();

    // Validate inputs - Moved validations to the beginning
    if (!sequencingRunItems || sequencingRunItems.length === 0) {
      setErrorMessage(
        formatMessage("molecularAnalysisRunStep_missingSequenceReactions")
      );
      setLoading(false);
      return;
    }
    if (!sequencingRunName || sequencingRunName.length === 0) {
      setErrorMessage(formatMessage("molecularAnalysisRunStep_invalidRunName"));
      setLoading(false);
      return;
    }
    if (!validateQualityControls()) {
      setErrorMessage(
        "Please ensure all quality controls have both a name and type."
      );
      setLoading(false);
      return;
    }

    try {
      // Perform the molecular analyis saving step.
      const molecularAnalysisRunId = await performMolecularAnalysisRunSave();

      // Perform the molecular analysis item saving step.
      await performMolecularAnalysisRunItemSave(molecularAnalysisRunId);

      // Perform quality control saving steps.
      await createNewQualityControls(molecularAnalysisRunId);
      await updateExistingQualityControls();
      await deleteRemovedQualityControls();

      setEditMode(false);
      setLoading(false);
      setReloadGenericMolecularAnalysisRun(Date.now());
      await onSaved?.(4);
    } catch (error: any) {
        console.error("Error saving sequencing run:", error);

        let message = "Error saving sequencing run:";

        // Append individual error message if present
        if (error.errorMessage) {
          message += ` ${error.errorMessage}`;
        }

        // Append all field error values if present
        if (error.fieldErrors && typeof error.fieldErrors === "object") {
          const fieldErrorValues = Object.values(error.fieldErrors)
            .filter((val) => typeof val === "string" && val.trim() !== "")
            .join(", ");
          if (fieldErrorValues) {
            message += ` ${fieldErrorValues}`;
          }
        }

        setErrorMessage(message);
        setLoading(false);
      }

  }

  // Handle saving
  useEffect(() => {
    if (performSave && !loading && editMode) {
      saveSequencingRun();
    }
  }, [performSave, loading, editMode]);

  return {
    loading: loading || loadingVocabularyItems,
    errorMessage,
    multipleRunWarning,
    sequencingRunName,
    setSequencingRunName,
    sequencingRunItems,
    setSequencingRunItems,
    attachments,
    qualityControls,
    qualityControlTypes,
    createNewQualityControl,
    deleteQualityControl,
    updateQualityControl,
    setAttachments,
    sequencingRunId: sequencingRun?.id,
    setMolecularAnalysisRunItemNames,
    setReloadGenericMolecularAnalysisRun,
    updateExistingQualityControls
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
