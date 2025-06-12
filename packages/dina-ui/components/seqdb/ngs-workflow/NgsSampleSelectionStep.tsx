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
import _ from "lodash";
import { useEffect, useState } from "react";
import { SeqdbMessage } from "../../../intl/seqdb-intl";
import {
  MaterialSample,
  MaterialSampleSummary
} from "../../../types/collection-api";
import { LibraryPrep, LibraryPrepBatch } from "../../../types/seqdb-api";
import { useMaterialSampleRelationshipColumns } from "../../collection/material-sample/useMaterialSampleRelationshipColumns";

export interface NgsSampleSelectionStepProps {
  batchId: string;
  onSaved: (
    nextStep: number,
    batchSaved?: PersistedResource<LibraryPrepBatch>
  ) => Promise<void>;
  editMode: boolean;
  setEditMode: (newValue: boolean) => void;
  performSave: boolean;
  setPerformSave: (newValue: boolean) => void;
}

export function NgsSampleSelectionStep({
  batchId,
  editMode,
  onSaved,
  setEditMode,
  performSave,
  setPerformSave
}: NgsSampleSelectionStepProps) {
  const { apiClient, bulkGet, save } = useApiClient();
  const { username } = useAccount();
  const { PCR_WORKFLOW_ELASTIC_SEARCH_COLUMN } =
    useMaterialSampleRelationshipColumns();

  // Check if a save was requested from the top level button bar.
  useEffect(() => {
    async function performSaveInternal() {
      await saveLibraryPrep();
      setPerformSave(false);
      await onSaved(2);
    }

    if (performSave) {
      performSaveInternal();
    }
  }, [performSave]);

  // Keep track of the previously selected resources to compare.
  const [previouslySelectedResources, setPreviouslySelectedResources] =
    useState<LibraryPrep[]>([]);

  // The selected resources to be used for the QueryPage.
  const [selectedResources, setSelectedResources] = useState<
    MaterialSampleSummary[] | undefined
  >(undefined);

  const [materialSampleSortOrder, setMaterialSampleSortOrder] = useLocalStorage<
    string[]
  >(`ngsMaterialSampleSortOrder-${batchId}`);

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
   * Retrieve all of the LibraryPrep that are associated with the PCR Batch from step 1.
   */
  async function fetchSampledIds() {
    await apiClient
      .get<LibraryPrep[]>("/seqdb-api/library-prep", {
        filter: filterBy([], {
          extraFilters: [
            {
              selector: "libraryPrepBatch.uuid",
              comparison: "==",
              arguments: batchId
            }
          ]
        })(""),
        include: "materialSample",
        page: {
          limit: 1000 // Maximum page size.
        }
      })
      .then((response) => {
        const libraryPreps: PersistedResource<LibraryPrep>[] =
          response?.data?.filter(
            (item) => item?.materialSample?.id !== undefined
          );
        const materialSampleIds: string[] =
          libraryPreps.map((item) => item?.materialSample?.id as string) ?? [];

        setPreviouslySelectedResources(libraryPreps);
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

  async function saveLibraryPrep() {
    try {
      const { data: libraryPrepBatch } = await apiClient.get<LibraryPrepBatch>(
        `seqdb-api/library-prep-batch/${batchId}`,
        {}
      );

      // Convert to UUID arrays to compare the two arrays.
      const selectedResourceUUIDs = _.compact(
        selectedResources?.map((material) => material.id)
      );
      const previouslySelectedResourcesUUIDs = _.compact(
        previouslySelectedResources?.map((item) => ({
          materialSampleUUID: item?.materialSample?.id,
          libraryPrepUUID: item?.id
        }))
      );

      // UUIDs of Library Prep that need to be created.
      const itemsToCreate = _.uniq(
        selectedResourceUUIDs.filter(
          (uuid) =>
            !previouslySelectedResourcesUUIDs.some(
              (item) => item.materialSampleUUID === uuid
            )
        )
      );

      // UUIDs of Library Prep that need to be deleted.
      const itemsToDelete = _.uniq(
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
              type: "library-prep",
              group: libraryPrepBatch.group ?? "",
              createdBy: username ?? "",
              libraryPrepBatch: _.pick(libraryPrepBatch, "id", "type"),
              relationships: {
                materialSample: {
                  data: {
                    id: materialUUID,
                    type: "material-sample"
                  }
                }
              }
            },
            type: "library-prep"
          })),
          { apiBaseUrl: "/seqdb-api" }
        );
      }

      // Perform deletes
      if (itemsToDelete.length !== 0) {
        await save(
          itemsToDelete.map((item) => ({
            delete: {
              id: item.libraryPrepUUID ?? "",
              type: "library-prep"
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
      {!editMode ? (
        <>
          <strong>
            <SeqdbMessage id="selectedSamplesTitle" />
          </strong>
          <QueryPage<any>
            indexName={"dina_material_sample_index"}
            uniqueName="ngs-material-sample-selection-step-view"
            columns={PCR_WORKFLOW_ELASTIC_SEARCH_COLUMN}
            enableColumnSelector={false}
            selectionMode={false}
            selectionResources={selectedResources}
            viewMode={true}
            reactTableProps={{ enableSorting: true, enableMultiSort: true }}
          />
        </>
      ) : (
        <QueryPage<any>
          indexName={"dina_material_sample_index"}
          uniqueName="ngs-material-sample-selection-step-edit"
          columns={PCR_WORKFLOW_ELASTIC_SEARCH_COLUMN}
          enableColumnSelector={false}
          selectionMode={true}
          selectionResources={selectedResources}
          setSelectionResources={setSelectedResourcesAndSaveOrder}
          viewMode={false}
          enableDnd={true}
          onDeselect={(unselected) => onSelectMaterial(unselected)}
          onSelect={(selected) => onDeselectMaterial(selected)}
          reactTableProps={{ enableSorting: true, enableMultiSort: true }}
        />
      )}
    </div>
  );
}
