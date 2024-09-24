import {
  DoOperationsError,
  filterBy,
  LoadingSpinner,
  QueryPage,
  SaveArgs,
  useApiClient,
  useQuery
} from "packages/common-ui/lib";
import { SeqdbMessage } from "packages/dina-ui/intl/seqdb-intl";
import {
  MaterialSample,
  StorageUnit
} from "packages/dina-ui/types/collection-api";
import { useEffect, useState } from "react";
import { useMaterialSampleRelationshipColumns } from "../collection/material-sample/useMaterialSampleRelationshipColumns";
import { useLocalStorage } from "@rehooks/local-storage";
import { compact, uniq, difference, concat } from "lodash";
import { useRouter } from "next/router";
import { StorageUnitUsage } from "packages/dina-ui/types/collection-api/resources/StorageUnitUsage";

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
  const router = useRouter();
  const storageUnitId = router.query.storageUnitId?.toString();

  // Resources that were previously linked to the Storage Unit
  const [prevSelectedResources, setPreviouslySelectedResources] = useState<
    MaterialSample[] | undefined
  >(undefined);

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
    try {
      const prevSelectedResourceIdsSet = new Set(
        prevSelectedResources?.map((prevSelected) => prevSelected.id)
      );

      const currentSelectedResourceIdsSet = new Set(
        selectedResources?.map((selectedResource) => selectedResource.id)
      );

      // Filter for resources that weren't already previously linked to storage unit
      // These resources need to be linked to the storage unit
      const resourcesToLink = selectedResources?.filter(
        (selectedResource) =>
          !prevSelectedResourceIdsSet.has(selectedResource.id)
      );
      if (resourcesToLink) {
        resourcesToLink.forEach(async (resource) => {
          // Create new storageUnitUsage, the storageUnit is saved here.
          const storageUnitUsageSaveArgs: SaveArgs<StorageUnitUsage>[] = [
            {
              type: "storage-unit-usage",
              resource: {
                storageUnit: {
                  type: "storage-unit",
                  id: storageUnitId!
                },
                type: "storage-unit-usage",
                id: undefined,
                usageType: "material-sample"
              }
            }
          ];

          const savedStorageUnitUsage = await save<StorageUnitUsage>(
            storageUnitUsageSaveArgs,
            {
              apiBaseUrl: "/collection-api"
            }
          );

          // Create link between resource and created storageUnitUsage resource
          resource.storageUnitUsage = savedStorageUnitUsage[0];
          const saveArg = [
            {
              resource: {
                id: resource.id,
                type: resource.type,
                relationships: {
                  storageUnitUsage: {
                    data: savedStorageUnitUsage[0]
                  }
                }
              },
              type: resource.type
            }
          ];

          await save(saveArg, {
            apiBaseUrl: "/collection-api"
          });
        });
      }

      // Filter for resources that were previously linked but now unselected, these need to be unlinked
      const resourcesToUnlink = prevSelectedResources?.filter(
        (prevSelectedResource) =>
          !currentSelectedResourceIdsSet.has(prevSelectedResource.id)
      );

      if (resourcesToUnlink) {
        resourcesToUnlink.forEach(async (resource) => {
          // Unlink storageUnitUsage from resource
          const saveArg = [
            {
              resource: {
                id: resource.id,
                type: resource.type,
                relationships: {
                  storageUnitUsage: {
                    data: null
                  }
                }
              },
              type: resource.type
            }
          ];
          await save(saveArg, {
            apiBaseUrl: "/collection-api"
          });

          // Delete storageUnitUsage
          await save<StorageUnitUsage>(
            [
              {
                delete: {
                  id: resource.storageUnitUsage?.id ?? null,
                  type: "storage-unit-usage"
                }
              }
            ],
            {
              apiBaseUrl: "/collection-api"
            }
          );
        });
      }
    } catch (e) {
      if (e.toString() === "Error: Access is denied") {
        throw new DoOperationsError("Access is denied");
      } else {
        console.error(e);
      }
    } finally {
      // Clear the previously selected resources.
      setPreviouslySelectedResources([]);
    }
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
