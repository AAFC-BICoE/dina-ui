import { useLocalStorage } from "@rehooks/local-storage";
import {
  CollapsibleSection,
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
import {
  MaterialSample,
  MaterialSampleSummary
} from "../../../../dina-ui/types/collection-api";
import { SeqdbMessage } from "../../../intl/seqdb-intl";
import { useMaterialSampleRelationshipColumns } from "../../collection/material-sample/useMaterialSampleRelationshipColumns";
import { GenericMolecularAnalysis } from "../../../types/seqdb-api/resources/GenericMolecularAnalysis";
import { GenericMolecularAnalysisItem } from "../../../types/seqdb-api/resources/GenericMolecularAnalysisItem";
import {
  MolecularAnalysisRunItem,
  MolecularAnalysisRunItemUsageType
} from "../../../types/seqdb-api/resources/molecular-analysis/MolecularAnalysisRunItem";
import DataPasteZone from "../../molecular-analysis/DataPasteZone";
import { useDinaIntl } from "../../../intl/dina-ui-intl";
import {
  MappedDataRow,
  SampleSelectionMappingTable
} from "../../molecular-analysis/SampleSelectionMappingTable";
import {
  handeDeleteMolecularAnalysisRunItems,
  handleDeleteGenericMolecularAnalysisItems,
  handleDeleteMolecularAnalysisRun,
  handleDeleteStorageUnitUsage
} from "../../molecular-analysis/MolecularAnalysisUtils";

export interface MolecularAnalysisSampleSelectionStepProps {
  molecularAnalysisId: string;
  onSaved: (
    nextStep: number,
    molecularAnalysisSaved?: PersistedResource<GenericMolecularAnalysis>
  ) => Promise<void>;
  editMode: boolean;
  performSave: boolean;
  setPerformSave: (newValue: boolean) => void;
}

export function MolecularAnalysisSampleSelectionStep({
  molecularAnalysisId,
  editMode,
  onSaved,
  performSave,
  setPerformSave
}: MolecularAnalysisSampleSelectionStepProps) {
  const { apiClient, bulkGet, save } = useApiClient();
  const { username } = useAccount();
  const { PCR_WORKFLOW_ELASTIC_SEARCH_COLUMN } =
    useMaterialSampleRelationshipColumns();

  const [extractedDataTable, setExtractedDataTable] = useState<string[][]>([]);
  const { formatMessage } = useDinaIntl();

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
          include:
            "materialSample,storageUnitUsage,molecularAnalysisRunItem,molecularAnalysisRunItem.run",
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
      const selectedResourceUUIDs = _.compact(
        selectedResources?.map((material) => material.id)
      );
      const previouslySelectedResourcesUUIDs = _.compact(
        previouslySelectedResources?.map((item) => ({
          materialSampleUUID: item?.materialSample?.id,
          molecularAnalysisItemUUID: item?.id
        }))
      );

      // UUIDs of Molecular Analysis Items that need to be created.
      const itemsToCreate = _.uniq(
        selectedResourceUUIDs.filter(
          (uuid) =>
            !previouslySelectedResourcesUUIDs.some(
              (item) => item.materialSampleUUID === uuid
            )
        )
      );

      // UUIDs of Molecular Analysis Items that need to be deleted.
      const itemsToDelete = _.uniq(
        previouslySelectedResourcesUUIDs.filter(
          (uuid) =>
            !selectedResourceUUIDs.includes(uuid.materialSampleUUID as string)
        )
      );

      const runId = previouslySelectedResources.find(
        (item) => item?.molecularAnalysisRunItem?.run?.id
      )?.molecularAnalysisRunItem?.run?.id;

      // Perform create
      if (itemsToCreate.length !== 0) {
        // If a molecular analysis exists, then we need to create a
        // molecular analysis run item.
        let molecularRunItemsCreated: MolecularAnalysisRunItem[] = [];
        if (runId) {
          molecularRunItemsCreated = await save<MolecularAnalysisRunItem>(
            itemsToCreate.map((_) => ({
              resource: {
                type: "molecular-analysis-run-item",
                usageType:
                  MolecularAnalysisRunItemUsageType.GENERIC_MOLECULAR_ANALYSIS_ITEM,
                relationships: {
                  run: {
                    data: {
                      type: "molecular-analysis-run",
                      id: runId
                    }
                  }
                }
              },
              type: "molecular-analysis-run-item"
            })),
            { apiBaseUrl: "/seqdb-api" }
          );
        }

        await save(
          itemsToCreate.map((materialUUID, index) => ({
            resource: {
              type: "generic-molecular-analysis-item",
              createdBy: username ?? "",
              genericMolecularAnalysis: _.pick(
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
            },
            type: "generic-molecular-analysis-item"
          })),
          { apiBaseUrl: "/seqdb-api" }
        );
      }

      // Perform deletes
      if (itemsToDelete.length !== 0) {
        const genericMolecularAnalysisItemIds: string[] = itemsToDelete
          .map((itemsToDelete) => itemsToDelete.molecularAnalysisItemUUID)
          .filter((id): id is string => id !== undefined);
        await handleDeleteGenericMolecularAnalysisItems(
          save,
          genericMolecularAnalysisItemIds
        );

        // Delete the storage unit usage if linked.
        const storageUnitUsageUUIDs = itemsToDelete
          .map(
            (item) =>
              previouslySelectedResources.find(
                (resource) => resource.id === item.molecularAnalysisItemUUID
              )?.storageUnitUsage?.id
          )
          .filter((item) => item);
        if (storageUnitUsageUUIDs.length > 0) {
          const storageUnitUsageIdsToDelete: string[] =
            storageUnitUsageUUIDs.filter(
              (id): id is string => id !== undefined
            );
          await handleDeleteStorageUnitUsage(save, storageUnitUsageIdsToDelete);
        }

        // Check if molecular analysis items need to be deleted as well.
        if (runId) {
          // Delete the molecular analysis run items.
          const molecularAnalysisRunItemIdsToDelete: string[] = itemsToDelete
            .map(
              (item) =>
                previouslySelectedResources.find(
                  (resource) => resource.id === item.molecularAnalysisItemUUID
                )?.molecularAnalysisRunItem?.id
            )
            .filter((id): id is string => id !== undefined);
          await handeDeleteMolecularAnalysisRunItems(
            save,
            molecularAnalysisRunItemIdsToDelete
          );

          // Delete the run if all seq-reactions are being deleted.
          if (itemsToDelete.length === previouslySelectedResources.length) {
            await handleDeleteMolecularAnalysisRun(save, runId);
          }
        }
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

  async function onTransferData(
    selectedColumn,
    extractedDataTable,
    setMappedDataTable
  ) {
    const newMappedDataTable: MappedDataRow[] = [];
    const selectedResources: MaterialSampleSummary[] = [];
    if (selectedColumn !== undefined) {
      for (let i = 0; i < extractedDataTable.length; i++) {
        const extractedMaterialSampleName =
          extractedDataTable[i][selectedColumn];
        if (!!extractedMaterialSampleName) {
          const materialSampleQuery = await apiClient.get<MaterialSample[]>(
            "collection-api/material-sample",
            {
              filter: {
                rsql: `materialSampleName=="${extractedMaterialSampleName}"`
              },
              include: "organism"
            }
          );
          const newRow: MappedDataRow = [
            extractedMaterialSampleName,
            materialSampleQuery.data.length
              ? {
                  id: materialSampleQuery.data[0].id,
                  type: materialSampleQuery.data[0].type,
                  name: materialSampleQuery.data[0].materialSampleName,
                  path: `/collection-api/material-sample?id=${materialSampleQuery.data[0].id}`
                }
              : { name: formatMessage("resourceNotFoundWarning") }
          ];
          newMappedDataTable.push(newRow);
          if (materialSampleQuery.data.length) {
            selectedResources.push({
              type: "material-sample-summary",
              id: materialSampleQuery.data[0].id,
              materialSampleName:
                materialSampleQuery.data[0].materialSampleName,
              effectiveDeterminations:
                materialSampleQuery.data[0].organism?.find((or) =>
                  or?.determination?.find((det) => det.isPrimary)
                )?.determination ?? undefined
            });
          }
        } else {
          newMappedDataTable.push([
            formatMessage("resourceNotFoundWarning"),
            { name: formatMessage("resourceNotFoundWarning") }
          ]);
        }
      }
      setSelectedResourcesAndSaveOrder?.(selectedResources);
      setMappedDataTable(newMappedDataTable);
    }
  }

  const onDataPaste = (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const clipboardData = event.clipboardData.getData("text/plain");
    const rows = clipboardData
      .trim()
      .split("\n")
      .map((row) =>
        row.split("\t").map((cell) => cell.replace(/\r/g, "").trim())
      );

    setExtractedDataTable(rows);
  };

  // Wait until selected resources are loaded.
  if (selectedResources === undefined) {
    return <LoadingSpinner loading={true} />;
  }

  return (
    <div style={{ marginTop: "20px" }}>
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
        <>
          {" "}
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
          <div className="mt-3">
            <CollapsibleSection
              id={"pasteMaterialSample"}
              headerKey={"pasteMaterialSample"}
            >
              <DataPasteZone onDataPaste={onDataPaste} />
              <SampleSelectionMappingTable
                extractedDataTable={extractedDataTable}
                onTransferData={onTransferData}
              />
            </CollapsibleSection>
          </div>
        </>
      )}
    </div>
  );
}
