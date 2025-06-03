import { useLocalStorage } from "@rehooks/local-storage";
import {
  DoOperationsError,
  LoadingSpinner,
  QueryPage,
  SaveArgs,
  filterBy,
  useAccount,
  useApiClient
} from "common-ui";
import { KitsuResponse, PersistedResource } from "kitsu";
import _ from "lodash";
import { useEffect, useState } from "react";
import {
  MaterialSample,
  MaterialSampleSummary
} from "../../../../dina-ui/types/collection-api";
import { SeqdbMessage } from "../../../intl/seqdb-intl";
import { PcrBatch, PcrBatchItem } from "../../../types/seqdb-api";
import { useMaterialSampleRelationshipColumns } from "../../collection/material-sample/useMaterialSampleRelationshipColumns";
import { MetagenomicsBatch } from "packages/dina-ui/types/seqdb-api/resources/metagenomics/MetagenomicsBatch";
import { MetagenomicsBatchItem } from "packages/dina-ui/types/seqdb-api/resources/metagenomics/MetagenomicsBatchItem";
import {
  MolecularAnalysisRunItem,
  MolecularAnalysisRunItemUsageType
} from "../../../types/seqdb-api/resources/molecular-analysis/MolecularAnalysisRunItem";

export interface SangerSampleSelectionStepProps {
  pcrBatchId: string;
  onSaved: (
    nextStep: number,
    pcrBatchSaved?: PersistedResource<PcrBatch>
  ) => Promise<void>;
  editMode: boolean;
  setEditMode: (newValue: boolean) => void;
  performSave: boolean;
  setPerformSave: (newValue: boolean) => void;
  metagenomicsBatch?: MetagenomicsBatch;
}

export function SangerSampleSelectionStep({
  pcrBatchId,
  metagenomicsBatch,
  editMode,
  onSaved,
  setEditMode,
  performSave,
  setPerformSave
}: SangerSampleSelectionStepProps) {
  const { apiClient, bulkGet, save } = useApiClient();
  const { username } = useAccount();
  const { PCR_WORKFLOW_ELASTIC_SEARCH_COLUMN } =
    useMaterialSampleRelationshipColumns();

  // Check if a save was requested from the top level button bar.
  useEffect(() => {
    async function performSaveInternal() {
      await savePcrBatchItems();
      setPerformSave(false);
      await onSaved(2);
    }

    if (performSave) {
      performSaveInternal();
    }
  }, [performSave]);

  // Keep track of the previously selected resources to compare.
  const [previouslySelectedResources, setPreviouslySelectedResources] =
    useState<PcrBatchItem[]>([]);

  // The selected resources to be used for the QueryPage.
  const [selectedResources, setSelectedResources] = useState<
    MaterialSampleSummary[] | undefined
  >(undefined);

  const [materialSampleSortOrder, setMaterialSampleSortOrder] = useLocalStorage<
    string[]
  >(`pcrWorkflowMaterialSampleSortOrder-${pcrBatchId}`);

  /**
   * When the page is first loaded, check if saved samples has already been chosen and reload them.
   */
  useEffect(() => {
    fetchSampledIds();
  }, [editMode]);

  function setSelectedResourcesAndSaveOrder(
    materialSamples: MaterialSampleSummary[]
  ) {
    setSelectedResources(materialSamples);
    setMaterialSampleSortOrder(
      _.compact(materialSamples.map((item) => item.id))
    );
  }

  // Sort MaterialSamples based on the preserved order in local storage
  function sortMaterialSamples(samples: MaterialSampleSummary[]) {
    if (materialSampleSortOrder) {
      const sorted = materialSampleSortOrder.map((sampleId) =>
        samples.find((item) => item?.id === sampleId)
      );
      samples.forEach((item) => {
        if (materialSampleSortOrder.indexOf(item?.id ?? "unknown") === -1) {
          sorted.push(item);
        }
      });
      return _.compact(sorted);
    } else {
      return _.compact(samples);
    }
  }

  function onSelectMaterial(selected: MaterialSample[]) {
    const ids = _.compact(
      _.uniq(
        _.concat(
          materialSampleSortOrder,
          selected.map((material) => material.id)
        )
      )
    );
    setMaterialSampleSortOrder(ids);
  }

  function onDeselectMaterial(unselected: MaterialSample[]) {
    const ids = _.uniq(
      _.difference(
        materialSampleSortOrder,
        _.compact(unselected.map((material) => material.id))
      )
    );
    setMaterialSampleSortOrder(ids);
  }

  /**
   * Retrieve all of the PCR Batch Items that are associated with the PCR Batch from step 1.
   */
  async function fetchSampledIds() {
    await apiClient
      .get<PcrBatchItem[]>("/seqdb-api/pcr-batch-item", {
        filter: filterBy([], {
          extraFilters: [
            {
              selector: "pcrBatch.uuid",
              comparison: "==",
              arguments: pcrBatchId
            }
          ]
        })(""),
        include: "materialSample",
        page: {
          limit: 1000 // Maximum page size.
        }
      })
      .then((response) => {
        const pcrBatchItems: PersistedResource<PcrBatchItem>[] =
          response?.data?.filter(
            (item) => item?.materialSample?.id !== undefined
          );
        const materialSampleIds: string[] =
          pcrBatchItems.map((item) => item?.materialSample?.id as string) ?? [];

        setPreviouslySelectedResources(pcrBatchItems);
        fetchSamples(materialSampleIds);
      });
  }

  /**
   * Taking all of the material sample UUIDs, retrieve the material samples using a bulk get
   * operation.
   *
   * @param sampleIds array of UUIDs.
   */
  async function fetchSamples(sampleIds: string[]) {
    await bulkGet<MaterialSampleSummary>(
      sampleIds.map((id) => `/material-sample-summary/${id}`),
      { apiBaseUrl: "/collection-api" }
    ).then((response) => {
      // If there is nothing stored yet, automatically go to edit mode.
      if (response.length === 0) {
        setEditMode(true);
      }
      const sorted = sortMaterialSamples(response ?? []);
      setSelectedResources(sorted);
    });
  }

  async function savePcrBatchItems() {
    try {
      const { data: pcrBatch } = await apiClient.get<PcrBatch>(
        `seqdb-api/pcr-batch/${pcrBatchId}`,
        {}
      );
      // Convert to UUID arrays to compare the two arrays.
      const selectedResourceUUIDs = _.compact(
        selectedResources?.map((material) => material.id)
      );
      const previouslySelectedResourcesUUIDs = _.compact(
        previouslySelectedResources?.map((item) => ({
          materialSampleUUID: item?.materialSample?.id,
          pcrBatchItemUUID: item?.id
        }))
      );

      // UUIDs of PCR Batch Items that need to be created.
      const itemsToCreate = _.uniq(
        selectedResourceUUIDs.filter(
          (uuid) =>
            !previouslySelectedResourcesUUIDs.some(
              (item) => item.materialSampleUUID === uuid
            )
        )
      );

      // UUIDs of PCR Batch Items that need to be deleted.
      const itemsToDelete = _.uniq(
        previouslySelectedResourcesUUIDs.filter(
          (uuid) =>
            !selectedResourceUUIDs.includes(uuid.materialSampleUUID as string)
        )
      );

      let molecularAnalysisRunId: string | undefined;
      let metagenomicsBatchItemsResp: KitsuResponse<
        MetagenomicsBatchItem[],
        undefined
      >;

      // If a MetagenomicsBatch exists
      if (metagenomicsBatch && metagenomicsBatch.id) {
        // Check for existing MolecularAnalysisRun before creating new MetagenomicsBatchItems
        metagenomicsBatchItemsResp = await apiClient.get<
          MetagenomicsBatchItem[]
        >(`seqdb-api/metagenomics-batch-item`, {
          filter: filterBy([], {
            extraFilters: [
              {
                selector: "metagenomicsBatch.uuid",
                comparison: "==",
                arguments: metagenomicsBatch.id
              }
            ]
          })(""),
          page: { limit: 1000 },
          include:
            "molecularAnalysisRunItem,molecularAnalysisRunItem.run,pcrBatchItem"
        });
        molecularAnalysisRunId = metagenomicsBatchItemsResp?.data?.find(
          (item) => item?.molecularAnalysisRunItem?.run?.id
        )?.molecularAnalysisRunItem?.run?.id;
      }

      // Perform create
      if (itemsToCreate.length !== 0) {
        const pcrBatchItems = await save<PcrBatchItem>(
          itemsToCreate.map((materialUUID) => ({
            resource: {
              type: "pcr-batch-item",
              group: pcrBatch.group ?? "",
              createdBy: username ?? "",
              pcrBatch: _.pick(pcrBatch, "id", "type"),
              relationships: {
                materialSample: {
                  data: {
                    id: materialUUID,
                    type: "material-sample"
                  }
                }
              }
            },
            type: "pcr-batch-item"
          })),
          { apiBaseUrl: "/seqdb-api" }
        );

        // If a MolecularAnalysisRun exists, then we need to create new
        // MolecularAnalysisRunItems for new MetagenomicsBatchItems.
        let molecularRunItemsCreated: MolecularAnalysisRunItem[] = [];
        if (molecularAnalysisRunId) {
          molecularRunItemsCreated = await save<MolecularAnalysisRunItem>(
            itemsToCreate.map((_) => ({
              resource: {
                type: "molecular-analysis-run-item",
                usageType: MolecularAnalysisRunItemUsageType.SEQ_REACTION,
                relationships: {
                  run: {
                    data: {
                      type: "molecular-analysis-run",
                      id: molecularAnalysisRunId
                    }
                  }
                }
              },
              type: "molecular-analysis-run-item"
            })),
            { apiBaseUrl: "/seqdb-api" }
          );
          if (metagenomicsBatch && metagenomicsBatch.id) {
            // Create MetagenomicsBatchItems for new PcrBatchItems
            const metagenomicsBatchItemSaveArgs: SaveArgs<MetagenomicsBatchItem>[] =
              pcrBatchItems.map((pcrBatchItem, index) => {
                return {
                  type: "metagenomics-batch-item",
                  resource: {
                    type: "metagenomics-batch-item",
                    relationships: {
                      // Link back to existing MetagenomicsBatch
                      metagenomicsBatch: {
                        data: {
                          id: metagenomicsBatch.id,
                          type: "metagenomics-batch"
                        }
                      },
                      // Link to new PcrBatchItem
                      pcrBatchItem: {
                        data: {
                          id: pcrBatchItem.id,
                          type: "pcr-batch-item"
                        }
                      },
                      // Included only if molecular run items were created.
                      molecularAnalysisRunItem:
                        molecularRunItemsCreated.length > 0 &&
                        molecularRunItemsCreated[index]
                          ? {
                              data: {
                                type: "molecular-analysis-run-item",
                                id: molecularRunItemsCreated[index].id
                              }
                            }
                          : undefined
                    }
                  }
                };
              });
            await save<MetagenomicsBatchItem>(metagenomicsBatchItemSaveArgs, {
              apiBaseUrl: "/seqdb-api"
            });
          }
        }
      }

      // Perform deletes
      if (itemsToDelete.length !== 0) {
        // Check if molecular analysis items need to be deleted.
        if (molecularAnalysisRunId) {
          // Delete the MetagenomicsBatchItems
          await save(
            itemsToDelete.map((item) => {
              const metagenomicsBatchItem =
                metagenomicsBatchItemsResp?.data?.find(
                  (metagenBatchItem) =>
                    metagenBatchItem?.pcrBatchItem?.id === item.pcrBatchItemUUID
                );
              return {
                delete: {
                  id: metagenomicsBatchItem?.id ?? "",
                  type: "metagenomics-batch-item"
                }
              };
            }),
            { apiBaseUrl: "/seqdb-api" }
          );
          // Delete the molecular analysis run items.
          await save(
            itemsToDelete.map((itemToDelete) => {
              const molecularAnalysisRunItem:
                | MolecularAnalysisRunItem
                | undefined = metagenomicsBatchItemsResp?.data?.find(
                (metagenomicsBatchItem) =>
                  metagenomicsBatchItem?.pcrBatchItem?.id ===
                  itemToDelete.pcrBatchItemUUID
              )?.molecularAnalysisRunItem;
              return {
                delete: {
                  id: molecularAnalysisRunItem?.id ?? "",
                  type: "molecular-analysis-run-item"
                }
              };
            }),
            { apiBaseUrl: "/seqdb-api" }
          );

          // Delete the run if all seq-reactions are being deleted.
          if (
            itemsToDelete.length ===
            previouslySelectedResourcesUUIDs.length +
              selectedResourceUUIDs.length
          ) {
            await save(
              [
                {
                  delete: {
                    id: molecularAnalysisRunId,
                    type: "molecular-analysis-run"
                  }
                }
              ],
              { apiBaseUrl: "/seqdb-api" }
            );
          }
        }

        await save(
          itemsToDelete.map((item) => ({
            delete: {
              id: item.pcrBatchItemUUID ?? "",
              type: "pcr-batch-item"
            }
          })),
          { apiBaseUrl: "/seqdb-api" }
        );
      }
    } catch (e) {
      if (e.toString() === "Error: Access is denied") {
        throw new DoOperationsError("Access is denied");
      }
    } finally {
      // Clear the previously selected resources.
      setPreviouslySelectedResources([]);
    }
  }

  // Wait until selected resources are loaded.
  if (selectedResources === undefined) {
    return <LoadingSpinner loading={true} />;
  }

  return (
    <div>
      {!editMode ? (
        <>
          <strong>
            <SeqdbMessage id="selectedSamplesTitle" />
          </strong>
          <QueryPage<any>
            indexName={"dina_material_sample_index"}
            uniqueName="pcr-material-sample-selection-step-read-only"
            columns={PCR_WORKFLOW_ELASTIC_SEARCH_COLUMN}
            enableColumnSelector={false}
            selectionMode={false}
            selectionResources={selectedResources}
            viewMode={true}
            reactTableProps={{
              enableSorting: true,
              enableMultiSort: true
            }}
          />
        </>
      ) : (
        <QueryPage<any>
          indexName={"dina_material_sample_index"}
          uniqueName="pcr-material-sample-selection-step-edit"
          columns={PCR_WORKFLOW_ELASTIC_SEARCH_COLUMN}
          enableColumnSelector={false}
          selectionMode={true}
          selectionResources={selectedResources}
          setSelectionResources={setSelectedResourcesAndSaveOrder}
          viewMode={false}
          enableDnd={true}
          onDeselect={(unselected) => onSelectMaterial(unselected)}
          onSelect={(selected) => onDeselectMaterial(selected)}
          reactTableProps={{
            enableSorting: true,
            enableMultiSort: true
          }}
        />
      )}
    </div>
  );
}
