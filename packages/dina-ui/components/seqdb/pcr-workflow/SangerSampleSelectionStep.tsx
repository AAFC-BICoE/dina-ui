import {
  DoOperationsError,
  LoadingSpinner,
  QueryPage,
  filterBy,
  useAccount,
  useApiClient
} from "common-ui";
import { PersistedResource } from "kitsu";
import { compact, pick, uniq } from "lodash";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { MaterialSample } from "../../../../dina-ui/types/collection-api";
import { SeqdbMessage } from "../../../intl/seqdb-intl";
import { PcrBatch, PcrBatchItem } from "../../../types/seqdb-api";
import { ELASTIC_SEARCH_COLUMN } from "../../collection/material-sample/MaterialSampleRelationshipColumns";

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
}

export function SangerSampleSelectionStep({
  pcrBatchId,
  editMode,
  onSaved,
  setEditMode,
  performSave,
  setPerformSave
}: SangerSampleSelectionStepProps) {
  const { apiClient, bulkGet, save } = useApiClient();
  const { username } = useAccount();

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
    MaterialSample[] | undefined
  >(undefined);

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
    await bulkGet<MaterialSample>(
      sampleIds.map((id) => `/material-sample/${id}?include=organism`),
      { apiBaseUrl: "/collection-api" }
    ).then((response) => {
      const materialSamplesTransformed = compact(response).map((resource) => ({
        data: {
          attributes: pick(resource, ["materialSampleName"])
        },
        id: resource.id,
        type: resource.type,
        included: {
          organism: resource.organism
        }
      }));

      // If there is nothing stored yet, automatically go to edit mode.
      if (materialSamplesTransformed.length === 0) {
        setEditMode(true);
      }

      setSelectedResources(materialSamplesTransformed ?? []);
    });
  }

  /**
   * When the page is first loaded, check if saved samples has already been chosen and reload them.
   */
  useEffect(() => {
    fetchSampledIds();
  }, [editMode]);

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
      <QueryPage<MaterialSample>
        indexName={"dina_material_sample_index"}
        columns={ELASTIC_SEARCH_COLUMN}
        selectionMode={editMode}
        selectionResources={selectedResources}
        setSelectionResources={setSelectedResources}
        viewMode={!editMode}
      />
    </div>
  );
}
