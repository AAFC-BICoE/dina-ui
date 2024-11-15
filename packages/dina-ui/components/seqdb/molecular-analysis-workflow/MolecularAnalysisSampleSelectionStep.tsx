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
import { compact, pick, uniq, difference, concat } from "lodash";
import { useEffect, useState } from "react";
import {
  MaterialSample,
  MaterialSampleSummary
} from "../../../../dina-ui/types/collection-api";
import { SeqdbMessage } from "../../../intl/seqdb-intl";
import { useMaterialSampleRelationshipColumns } from "../../collection/material-sample/useMaterialSampleRelationshipColumns";
import { GenericMolecularAnalysis } from "packages/dina-ui/types/seqdb-api/resources/GenericMolecularAnalysis";
import { GenericMolecularAnalysisItem } from "packages/dina-ui/types/seqdb-api/resources/GenericMolecularAnalysisItem";

export interface MolecularAnalysisSampleSelectionStepProps {
  molecularAnalysisId: string;
  onSaved: (
    nextStep: number,
    molecularAnalysisSaved?: PersistedResource<GenericMolecularAnalysis>
  ) => Promise<void>;
  editMode: boolean;
  setEditMode: (newValue: boolean) => void;
  performSave: boolean;
  setPerformSave: (newValue: boolean) => void;
}

export function MolecularAnalysisSampleSelectionStep({
  molecularAnalysisId,
  editMode,
  onSaved,
  setEditMode,
  performSave,
  setPerformSave
}: MolecularAnalysisSampleSelectionStepProps) {
  const { apiClient, bulkGet, save } = useApiClient();
  const { username } = useAccount();
  const { PCR_WORKFLOW_ELASTIC_SEARCH_COLUMN } =
    useMaterialSampleRelationshipColumns();

  // Check if a save was requested from the top level button bar.
  useEffect(() => {
    async function performSaveInternal() {
      await saveMolecularAnalysisItems();
      setPerformSave(false);
      await onSaved(2);
    }

    if (performSave) {
      performSaveInternal();
    }
  }, [performSave]);

  // Keep track of the previously selected resources to compare.
  const [previouslySelectedResources, setPreviouslySelectedResources] =
    useState<GenericMolecularAnalysisItem[]>([]);

  // The selected resources to be used for the QueryPage.
  const [selectedResources, setSelectedResources] = useState<
    MaterialSampleSummary[] | undefined
  >(undefined);

  const [materialSampleSortOrder, setMaterialSampleSortOrder] = useLocalStorage<
    string[]
  >(`molecularAnalysisWorkflowMaterialSampleSortOrder-${molecularAnalysisId}`);

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
    setMaterialSampleSortOrder(compact(materialSamples.map((item) => item.id)));
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
   * Retrieve all of the Molecular Analysis Items that are associated with the Molecular Analysis
   * from step 1.
   */
  async function fetchSampledIds() {
    await apiClient
      .get<GenericMolecularAnalysisItem[]>(
        "/seqdb-api/generic-molecular-analysis-item",
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
          include: "materialSample",
          page: {
            limit: 1000 // Maximum page size.
          }
        }
      )
      .then((response) => {
        const molecularAnalysisItems: PersistedResource<GenericMolecularAnalysisItem>[] =
          response?.data?.filter(
            (item) => item?.materialSample?.id !== undefined
          );
        const materialSampleIds: string[] =
          molecularAnalysisItems.map(
            (item) => item?.materialSample?.id as string
          ) ?? [];

        setPreviouslySelectedResources(molecularAnalysisItems);
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

  async function saveMolecularAnalysisItems() {
    try {
      const { data: genericMolecularAnalysis } =
        await apiClient.get<GenericMolecularAnalysis>(
          `seqdb-api/generic-molecular-analysis/${molecularAnalysisId}`,
          {}
        );

      // Convert to UUID arrays to compare the two arrays.
      const selectedResourceUUIDs = compact(
        selectedResources?.map((material) => material.id)
      );
      const previouslySelectedResourcesUUIDs = compact(
        previouslySelectedResources?.map((item) => ({
          materialSampleUUID: item?.materialSample?.id,
          molecularAnalysisItemUUID: item?.id
        }))
      );

      // UUIDs of Molecular Analysis Items that need to be created.
      const itemsToCreate = uniq(
        selectedResourceUUIDs.filter(
          (uuid) =>
            !previouslySelectedResourcesUUIDs.some(
              (item) => item.materialSampleUUID === uuid
            )
        )
      );

      // UUIDs of Molecular Analysis Items that need to be deleted.
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
              type: "generic-molecular-analysis-item",
              createdBy: username ?? "",
              genericMolecularAnalysis: pick(
                genericMolecularAnalysis,
                "id",
                "type"
              ),
              relationships: {
                materialSample: {
                  data: {
                    id: materialUUID,
                    type: "material-sample"
                  }
                }
              }
            },
            type: "generic-molecular-analysis-item"
          })),
          { apiBaseUrl: "/seqdb-api" }
        );
      }

      // Perform deletes
      if (itemsToDelete.length !== 0) {
        await save(
          itemsToDelete.map((item) => ({
            delete: {
              id: item.molecularAnalysisItemUUID ?? "",
              type: "generic-molecular-analysis-item"
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
            uniqueName="molecular-analysis-material-sample-selection-step-read-only"
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
          uniqueName="molecular-analysis-material-sample-selection-step-edit"
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
