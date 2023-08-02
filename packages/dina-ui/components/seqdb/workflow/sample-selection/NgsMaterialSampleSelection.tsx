import { useLocalStorage } from "@rehooks/local-storage";
import {
  DoOperationsError,
  LoadingSpinner,
  QueryPage,
  filterBy,
  useAccount,
  useApiClient
} from "common-ui";
import { PersistedResource } from "kitsu";
import { compact, concat, difference, pick, uniq } from "lodash";
import { useEffect, useState } from "react";
import { SeqdbMessage } from "../../../../intl/seqdb-intl";
import {
  MaterialSample,
  MaterialSampleSummary
} from "../../../../types/collection-api";
import { PcrBatch, PcrBatchItem } from "../../../../types/seqdb-api";
import { useMaterialSampleRelationshipColumns } from "../../../collection/material-sample/useMaterialSampleRelationshipColumns";
import { StepRendererProps } from "../StepRenderer";

export function NgsMaterialSampleSelection({ chain, step }: StepRendererProps) {
  const { apiClient, bulkGet, save } = useApiClient();
  const { username } = useAccount();
  const { PCR_WORKFLOW_ELASTIC_SEARCH_COLUMN } =
    useMaterialSampleRelationshipColumns();

  // Keep track of the previously selected resources to compare.
  const [previouslySelectedResources, setPreviouslySelectedResources] =
    useState<PcrBatchItem[]>([]);

  // The selected resources to be used for the QueryPage.
  const [selectedResources, setSelectedResources] = useState<
    MaterialSampleSummary[] | undefined
  >(undefined);

  const [materialSampleSortOrder, setMaterialSampleSortOrder] = useLocalStorage<
    string[]
  >(`ngsWorkflowMaterialSampleSortOrder-${chain.id}`);

  /**
   * When the page is first loaded, check if saved samples has already been chosen and reload them.
   */
  useEffect(() => {
    fetchSampledIds();
  }, []);

  function setSelectedResourcesAndSaveOrder(
    materialSamples: MaterialSampleSummary[]
  ) {
    setSelectedResources(materialSamples);
    setMaterialSampleSortOrder(compact(materialSamples.map((item) => item.id)));
  }

  // Sort MaterialSamples based on the preserved order in local storage
  function sortMaterialSamples(samples: MaterialSampleSummary[]) {
    if (materialSampleSortOrder) {
      const sorted = materialSampleSortOrder.map((sampleId) =>
        samples.find((item) => item.id === sampleId)
      );
      samples.forEach((item) => {
        if (materialSampleSortOrder.indexOf(item.id ?? "unknown") === -1) {
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
      const sorted = sortMaterialSamples(response);
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
      const selectedResourceUUIDs = compact(
        selectedResources?.map((material) => material.id)
      );
      const previouslySelectedResourcesUUIDs = compact(
        previouslySelectedResources?.map((item) => ({
          materialSampleUUID: item?.materialSample?.id,
          pcrBatchItemUUID: item?.id
        }))
      );

      const temp = previouslySelectedResources?.map((item) => ({
        materialSampleUUID: item?.materialSample?.id,
        pcrBatchItemUUID: item?.id
      }));
      // UUIDs of PCR Batch Items that need to be created.
      const itemsToCreate = uniq(
        selectedResourceUUIDs.filter(
          (uuid) =>
            !previouslySelectedResourcesUUIDs.some(
              (item) => item.materialSampleUUID === uuid
            )
        )
      );

      // UUIDs of PCR Batch Items that need to be deleted.
      const itemsToDelete = uniq(
        previouslySelectedResourcesUUIDs.filter(
          (uuid) =>
            !selectedResourceUUIDs.includes(uuid.materialSampleUUID as string)
        )
      );

      // Perform create
      if (itemsToCreate.length !== 0) {
        await save(
          itemsToCreate.map((materialUUID) => ({
            resource: {
              type: "pcr-batch-item",
              group: pcrBatch.group ?? "",
              createdBy: username ?? "",
              pcrBatch: pick(pcrBatch, "id", "type"),
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
      }

      // Perform deletes
      if (itemsToDelete.length !== 0) {
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
      // setEditMode(false);
    }
  }

  // Wait until selected resources are loaded.
  if (selectedResources === undefined) {
    return <LoadingSpinner loading={true} />;
  }

  return (
    <div>
      {!editMode && (
        <strong>
          <SeqdbMessage id="selectedSamplesTitle" />
        </strong>
      )}
      <QueryPage<any>
        indexName={"dina_material_sample_index"}
        columns={PCR_WORKFLOW_ELASTIC_SEARCH_COLUMN}
        selectionMode={editMode}
        selectionResources={selectedResources}
        setSelectionResources={setSelectedResourcesAndSaveOrder}
        viewMode={!editMode}
        enableDnd={true}
        onDeselect={(unselected) => onSelectMaterial(unselected)}
        onSelect={(selected) => onDeselectMaterial(selected)}
      />
    </div>
  );
}
