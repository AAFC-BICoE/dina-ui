import { PersistedResource } from "kitsu";
import _ from "lodash";
import { useApiClient } from "common-ui";
import { MaterialSample } from "../../../../types/collection-api";
import { StorageUnitUsage } from "../../../../types/collection-api/resources/StorageUnitUsage";
import {
  PcrBatchItem,
  PcrBatch,
  SeqReaction,
  SeqBatch,
  LibraryPrep,
  LibraryPrepBatch
} from "../../../../types/seqdb-api";
import { useState, useRef, useEffect } from "react";
import { UrlObject } from "url";
import { CellGrid } from "../../../seqdb/container-grid/ContainerGrid";
import { GridCoordinatesControls } from "../StorageUnitGrid";

export function useGridCoordinatesControls({
  materialSamples,
  storageUnit,
  setLoading
}: GridCoordinatesControls) {
  const [gridState, setGridState] = useState({
    cellGrid: {} as CellGrid<any>,
    movedItems: [] as any[]
  });

  const usageTypeRef = useRef<string | undefined>(undefined);
  const editContentsPathRef = useRef<string>("");
  const usageTypeLinkRef = useRef<UrlObject>();
  const usageTypeResourceNameRef = useRef<string>();

  // Change to track an array of objects with well coordinate and associated samples.
  const multipleSamplesWellCoordinates = useRef<
    { coordinate: string; samples: string[] }[]
  >([]);

  const { apiClient } = useApiClient();

  useEffect(() => {
    getGridState();
  }, []);

  async function getGridState() {
    setLoading?.(true);
    const newCellGrid: CellGrid<any> = {};
    if (_.isArray(materialSamples) && materialSamples.length > 0) {
      const storageUnitUsages = materialSamples.map(
        (sample) => sample.storageUnitUsage
      );
      usageTypeRef.current = storageUnitUsages[0]?.usageType;
      editContentsPathRef.current = `/collection/storage-unit/grid?storageUnitId=${storageUnit.id}&editMode=true&step=1`;
      materialSamples.forEach((materialSample) => {
        const storageUnitUsage = storageUnitUsages.find(
          (usage) => usage?.id === materialSample?.storageUnitUsage?.id
        );
        if (storageUnitUsage) {
          const key = `${storageUnitUsage?.wellRow?.toUpperCase()}_${
            storageUnitUsage?.wellColumn
          }`;

          if (newCellGrid[key]) {
            // Update the existing entry for multiple samples
            const existingEntry = multipleSamplesWellCoordinates.current.find(
              (entry) => entry.coordinate === key
            );

            if (existingEntry) {
              existingEntry.samples.push(
                materialSample.materialSampleName ?? ""
              );
            } else {
              multipleSamplesWellCoordinates.current.push({
                coordinate: key,
                samples: [
                  newCellGrid[key].sampleName,
                  materialSample.materialSampleName
                ]
              });
            }
          } else {
            newCellGrid[key] = {
              sampleName: materialSample.materialSampleName,
              sampleId: materialSample.id
            };
          }
        }
      });
    }

    try {
      const storageUnitUsagesQuery = await apiClient.get<StorageUnitUsage[]>(
        "collection-api/storage-unit-usage/",
        {
          include: "storageUnit",
          filter: { rsql: `storageUnit.uuid==${storageUnit?.id}` }
        }
      );

      if (storageUnitUsagesQuery.data.length > 0) {
        usageTypeRef.current = storageUnitUsagesQuery?.data?.[0]?.usageType;
        // Use map to return an array of promises
        const gridPromises = storageUnitUsagesQuery.data.map(
          async (storageUnitUsage, index) => {
            if (storageUnitUsage.usageType === "pcr-batch-item") {
              const pcrBatchItemQuery = await apiClient.get<PcrBatchItem[]>(
                `seqdb-api/pcr-batch-item`,
                {
                  include: `materialSample,${index === 0 ? "pcrBatch" : ""}`,
                  filter: { "storageUnitUsage.uuid": storageUnitUsage?.id }
                }
              );
              const pcrBatchItem = pcrBatchItemQuery.data[0];
              if (pcrBatchItem.pcrBatch) {
                try {
                  const pcrBatchQuery = await apiClient.get<PcrBatch>(
                    `seqdb-api/pcr-batch/${pcrBatchItem.pcrBatch.id}`,
                    {}
                  );
                  const pcrBatch = pcrBatchQuery.data;
                  usageTypeResourceNameRef.current = pcrBatch.name;
                  usageTypeLinkRef.current = {
                    pathname: `/seqdb/pcr-batch/view`,
                    query: {
                      id: pcrBatch?.id
                    }
                  };
                  if (pcrBatch?.isCompleted) {
                    editContentsPathRef.current = `/seqdb/pcr-batch/view?id=${pcrBatch?.id}`;
                  } else {
                    editContentsPathRef.current = `/seqdb/pcr-workflow/run?pcrBatchId=${pcrBatch?.id}&editMode=true&step=2`;
                  }
                } catch (e) {
                  console.error(e);
                }
              }

              if (pcrBatchItem) {
                await getCellGrid(
                  pcrBatchItem,
                  storageUnitUsage,
                  "pcr-batch-item"
                );
              }
            } else if (storageUnitUsage.usageType === "library-prep") {
              const libraryPrepQuery = await apiClient.get<LibraryPrep[]>(
                `seqdb-api/library-prep`,
                {
                  include: `materialSample,${
                    index === 0 ? "libraryPrepBatch" : ""
                  }`,
                  filter: { "storageUnitUsage.uuid": storageUnitUsage?.id }
                }
              );
              const libraryPrep = libraryPrepQuery.data[0];
              if (libraryPrep.libraryPrepBatch) {
                try {
                  const libraryPrepBatchQuery =
                    await apiClient.get<LibraryPrepBatch>(
                      `seqdb-api/library-prep-batch/${libraryPrep.libraryPrepBatch.id}`,
                      {}
                    );
                  const libraryPrepBatch = libraryPrepBatchQuery.data;
                  usageTypeResourceNameRef.current = libraryPrepBatch.name;
                  usageTypeLinkRef.current = {
                    pathname: `/seqdb/ngs-workflow/view`,
                    query: {
                      id: libraryPrepBatch?.id
                    }
                  };
                  editContentsPathRef.current = `/seqdb/ngs-workflow/run?id=${libraryPrepBatch?.id}&editMode=true&step=3`;
                } catch (e) {
                  console.error(e);
                }
              }

              if (libraryPrep) {
                await getCellGrid(
                  libraryPrep,
                  storageUnitUsage,
                  "library-prep"
                );
              }
            } else if (storageUnitUsage.usageType === "seq-reaction") {
              const seqReactionQuery = await apiClient.get<SeqReaction[]>(
                `seqdb-api/seq-reaction`,
                {
                  include: `pcrBatchItem,${index === 0 ? "seqBatch" : ""}`,
                  filter: { "storageUnitUsage.uuid": storageUnitUsage?.id }
                }
              );
              const seqReaction = seqReactionQuery.data[0];
              if (seqReaction.seqBatch) {
                try {
                  const seqBatchQuery = await apiClient.get<SeqBatch>(
                    `seqdb-api/seq-batch/${seqReaction.seqBatch.id}`,
                    {}
                  );
                  const seqBatch = seqBatchQuery.data;
                  usageTypeResourceNameRef.current = seqBatch.name;
                  usageTypeLinkRef.current = {
                    pathname: `/seqdb/seq-batch/view`,
                    query: {
                      id: seqBatch?.id
                    }
                  };
                  if (seqBatch?.isCompleted) {
                    editContentsPathRef.current = `/seqdb/seq-batch/view?id=${seqBatch?.id}`;
                  } else {
                    editContentsPathRef.current = `/seqdb/seq-workflow/run?seqBatchId=${seqBatch?.id}&editMode=true&step=2`;
                  }
                } catch (e) {
                  console.error(e);
                }
              }
              if (seqReaction && seqReaction.pcrBatchItem) {
                await getCellGrid(
                  seqReaction.pcrBatchItem,
                  storageUnitUsage,
                  "pcr-batch-item"
                );
              }
            } else {
              console.error("Unexpected usage type.");
            }
          }
        );

        // Await all the promises
        await Promise.all(gridPromises);
      }

      // Initialize grid state
      setGridState({
        cellGrid: newCellGrid,
        movedItems: []
      });
    } catch (error) {
      console.error("Error fetching grid state:", error);
    } finally {
      // Ensure setLoading is called after all async operations complete
      setLoading?.(false);
    }

    async function getCellGrid(
      resource,
      storageUnitUsage: PersistedResource<StorageUnitUsage>,
      type
    ) {
      const pcrBatchItemWithMaterialSampleIdQuery =
        await apiClient.get<PcrBatchItem>(`seqdb-api/${type}/${resource?.id}`, {
          include: "materialSample"
        });
      const pcrBatchItemWithMaterialSampleId =
        pcrBatchItemWithMaterialSampleIdQuery.data;
      const materialSampleQuery = await apiClient.get<MaterialSample>(
        `collection-api/material-sample-summary/${pcrBatchItemWithMaterialSampleId.materialSample?.id}`,
        {}
      );
      const materialSample = materialSampleQuery.data;
      const key = `${storageUnitUsage?.wellRow?.toUpperCase()}_${
        storageUnitUsage?.wellColumn
      }`;

      if (newCellGrid[key]) {
        // Update the existing entry for multiple samples
        const existingEntry = multipleSamplesWellCoordinates.current.find(
          (entry) => entry.coordinate === key
        );

        if (existingEntry) {
          existingEntry.samples.push(materialSample.materialSampleName ?? "");
        } else {
          multipleSamplesWellCoordinates.current.push({
            coordinate: key,
            samples: [
              newCellGrid[key].sampleName,
              materialSample.materialSampleName
            ]
          });
        }
      } else {
        newCellGrid[key] = {
          sampleName: materialSample.materialSampleName,
          sampleId: materialSample.id
        };
      }
    }
  }

  // Filter out samples without coordinates from multipleSamplesWellCoordinates
  // They simply don't have a coordinate yet not necessarily occupying the same well
  multipleSamplesWellCoordinates.current =
    multipleSamplesWellCoordinates.current.filter(
      (sample) => !sample.coordinate.includes("undefined")
    );

  return {
    ...gridState,
    multipleSamplesWellCoordinates,
    usageTypeRef,
    editContentsPathRef,
    usageTypeLinkRef,
    usageTypeResourceNameRef,
    usageType: parseUsageType(usageTypeRef.current)
  };
}

function parseUsageType(usageType) {
  const usageTypeMap = {
    "material-sample": "Material Sample",
    "pcr-batch-item": "PCR Batch",
    "seq-reaction": "Seq Batch",
    "library-prep": "Library Prep Batch"
  };
  return usageTypeMap[usageType];
}
