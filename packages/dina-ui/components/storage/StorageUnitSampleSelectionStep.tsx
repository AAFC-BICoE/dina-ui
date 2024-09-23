import { PersistedResource } from "kitsu";
import {
  filterBy,
  LoadingSpinner,
  QueryPage,
  useApiClient,
  useQuery
} from "packages/common-ui/lib";
import { SeqdbMessage } from "packages/dina-ui/intl/seqdb-intl";
import {
  MaterialSampleSummary,
  MaterialSample,
  StorageUnit
} from "packages/dina-ui/types/collection-api";
import { useEffect, useState } from "react";
import { useMaterialSampleRelationshipColumns } from "../collection/material-sample/useMaterialSampleRelationshipColumns";
import { useLocalStorage } from "@rehooks/local-storage";
import { compact, pick, uniq, difference, concat } from "lodash";

interface StorageUnitSampleSelectionStepProps {
  onSaved: (nextStep?: number) => Promise<void>;
  performSave: boolean;
  editMode: boolean;
  storageUnit: StorageUnit;
}

export const SAMPLE_SELECTION_MATERIAL_SAMPLE_SORT_ORDER = `sampleSelectionMaterialSampleSortOrder`;

export function StorageUnitSampleSelectionStep({
  onSaved,
  performSave,
  editMode,
  storageUnit
}: StorageUnitSampleSelectionStepProps) {
  // The selected resources to be used for the QueryPage.
  const [selectedResources, setSelectedResources] = useState<
    MaterialSample[] | undefined
  >(undefined);

  // Resources that were previously linked to the Storage Unit
  const [previouslySelectedResources, setPreviouslySelectedResources] =
    useState<MaterialSample[] | undefined>(undefined);
  const materialSamplesQuery = useQuery<MaterialSample[]>(
    {
      path: "collection-api/material-sample",
      filter: { rsql: `storageUnitUsage.storageUnit.uuid==${storageUnit?.id}` },
      page: { limit: 1000 },
      include: "storageUnitUsage"
    },
    {
      onSuccess: (response) => {
        const sorted = sortMaterialSamples(response.data ?? []);

        // On load up, the current selectedResources and previouslySelectedResources will both be the resources that were already linked to the storage unit
        setSelectedResources(sorted);
        setPreviouslySelectedResources(sorted);
      }
    }
  );
  const { apiClient, bulkGet, save } = useApiClient();
  const { STORAGE_UNIT_GRID_ELASTIC_SEARCH_COLUMN } =
    useMaterialSampleRelationshipColumns();

  const [materialSampleSortOrder, setMaterialSampleSortOrder] = useLocalStorage<
    string[]
  >(SAMPLE_SELECTION_MATERIAL_SAMPLE_SORT_ORDER);

  // Perform save and redirect if Save button from button bar clicked
  useEffect(() => {
    async function performSaveInternal() {
      await saveMaterialSamples();
      await onSaved(1);
    }

    if (performSave) {
      performSaveInternal();
    }
  }, [performSave]);

  function setSelectedResourcesAndSaveOrder(materialSamples: MaterialSample[]) {
    setSelectedResources(materialSamples);
    setMaterialSampleSortOrder(compact(materialSamples.map((item) => item.id)));
  }

  // Sort MaterialSamples based on the preserved order in local storage
  function sortMaterialSamples(samples: MaterialSample[]) {
    if (materialSampleSortOrder) {
      const sorted = materialSampleSortOrder.map((sampleId) =>
        samples.find((item) => item?.id === sampleId)
      );
      samples.forEach((item) => {
        if (materialSampleSortOrder.indexOf(item?.id ?? "unknown") === -1) {
          sorted.push(item);
        }
      });
      return compact(sorted);
    } else {
      return compact(samples);
    }
  }

  function onSelectMaterial(selected: MaterialSample[]) {
    const ids = compact(
      uniq(
        concat(
          materialSampleSortOrder,
          selected.map((material) => material.id)
        )
      )
    );
    setMaterialSampleSortOrder(ids);
  }

  function onDeselectMaterial(unselected: MaterialSample[]) {
    const ids = uniq(
      difference(
        materialSampleSortOrder,
        compact(unselected.map((material) => material.id))
      )
    );
    setMaterialSampleSortOrder(ids);
  }

  async function saveMaterialSamples() {
    // try {
    //   const { data: pcrBatch } = await apiClient.get<PcrBatch>(
    //     `seqdb-api/pcr-batch/${pcrBatchId}`,
    //     {}
    //   );
    //   // Convert to UUID arrays to compare the two arrays.
    //   const selectedResourceUUIDs = compact(
    //     selectedResources?.map((material) => material.id)
    //   );
    //   const previouslySelectedResourcesUUIDs = compact(
    //     previouslySelectedResources?.map((item) => ({
    //       materialSampleUUID: item?.materialSample?.id,
    //       pcrBatchItemUUID: item?.id
    //     }))
    //   );
    //   const temp = previouslySelectedResources?.map((item) => ({
    //     materialSampleUUID: item?.materialSample?.id,
    //     pcrBatchItemUUID: item?.id
    //   }));
    //   // UUIDs of PCR Batch Items that need to be created.
    //   const itemsToCreate = uniq(
    //     selectedResourceUUIDs.filter(
    //       (uuid) =>
    //         !previouslySelectedResourcesUUIDs.some(
    //           (item) => item.materialSampleUUID === uuid
    //         )
    //     )
    //   );
    //   // UUIDs of PCR Batch Items that need to be deleted.
    //   const itemsToDelete = uniq(
    //     previouslySelectedResourcesUUIDs.filter(
    //       (uuid) =>
    //         !selectedResourceUUIDs.includes(uuid.materialSampleUUID as string)
    //     )
    //   );
    //   // Perform create
    //   if (itemsToCreate.length !== 0) {
    //     await save(
    //       itemsToCreate.map((materialUUID) => ({
    //         resource: {
    //           type: "pcr-batch-item",
    //           group: pcrBatch.group ?? "",
    //           createdBy: username ?? "",
    //           pcrBatch: pick(pcrBatch, "id", "type"),
    //           relationships: {
    //             materialSample: {
    //               data: {
    //                 id: materialUUID,
    //                 type: "material-sample"
    //               }
    //             }
    //           }
    //         },
    //         type: "pcr-batch-item"
    //       })),
    //       { apiBaseUrl: "/seqdb-api" }
    //     );
    //   }
    //   // Perform deletes
    //   if (itemsToDelete.length !== 0) {
    //     await save(
    //       itemsToDelete.map((item) => ({
    //         delete: {
    //           id: item.pcrBatchItemUUID ?? "",
    //           type: "pcr-batch-item"
    //         }
    //       })),
    //       { apiBaseUrl: "/seqdb-api" }
    //     );
    //   }
    // } catch (e) {
    //   if (e.toString() === "Error: Access is denied") {
    //     throw new DoOperationsError("Access is denied");
    //   }
    // } finally {
    //   // Clear the previously selected resources.
    //   setPreviouslySelectedResources([]);
    //   // setEditMode(false);
    // }
  }
  return selectedResources === undefined ? (
    <LoadingSpinner loading={true} />
  ) : (
    <div>
      {!editMode ? (
        <>
          <strong>
            <SeqdbMessage id="selectedSamplesTitle" />
          </strong>
          <QueryPage<any>
            indexName={"dina_material_sample_index"}
            uniqueName="storage-unit-material-sample-selection-step-read-only"
            columns={STORAGE_UNIT_GRID_ELASTIC_SEARCH_COLUMN}
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
          uniqueName="storage-unit-material-sample-selection-step-edit"
          columns={STORAGE_UNIT_GRID_ELASTIC_SEARCH_COLUMN}
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
