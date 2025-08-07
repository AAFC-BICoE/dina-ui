import {
  ApiClientContext,
  DinaFormSubmitParams,
  filterBy,
  SaveArgs,
  useQuery
} from "common-ui";
import _, { Dictionary } from "lodash";
import { useContext, useState, useEffect } from "react";
import {
  MaterialSampleSummary,
  Protocol,
  StorageUnit,
  StorageUnitType
} from "packages/dina-ui/types/collection-api";
import { StorageUnitUsage } from "packages/dina-ui/types/collection-api/resources/StorageUnitUsage";
import {
  NgsIndex,
  ngsIndexParser,
  pcrBatchItemParser
} from "packages/dina-ui/types/seqdb-api";
import { MetagenomicsIndexAssignmentStepProps } from "../metagenomics-workflow/MetagenomicsIndexAssignmentStep";
import {
  MetagenomicsBatchItem,
  metagenomicsBatchItemParser
} from "packages/dina-ui/types/seqdb-api/resources/metagenomics/MetagenomicsBatchItem";

export interface UseMetagenomicsIndexAssignmentReturn {
  loading: boolean;
  metagenomicsIndexAssignmentResources?: MetagenomicsIndexAssignmentResource[];
  materialSampleSummaries?: MaterialSampleSummary[];
  ngsIndexes?: NgsIndex[];
  storageUnitType?: StorageUnitType;
  protocol?: Protocol;
  onSubmitGrid: ({
    submittedValues
  }: DinaFormSubmitParams<any>) => Promise<void>;
  onSubmitTable: ({
    submittedValues
  }: DinaFormSubmitParams<any>) => Promise<void>;
}

// UI-side only type that combines MetagenomicsBatchItem and other fields necessary for Index Assignment step
export type MetagenomicsIndexAssignmentResource = MetagenomicsBatchItem & {
  materialSampleSummary?: MaterialSampleSummary;
  storageUnitUsage?: StorageUnitUsage;
};

export function useMetagenomicsIndexAssignmentAPI({
  pcrBatch,
  metagenomicsBatch,
  editMode,
  setEditMode,
  setPerformSave,
  onSaved
}: Partial<MetagenomicsIndexAssignmentStepProps>): UseMetagenomicsIndexAssignmentReturn {
  const { save, apiClient, bulkGet } = useContext(ApiClientContext);

  const [lastSave, setLastSave] = useState<number>();

  const [storageUnitType, setStorageUnitType] = useState<StorageUnitType>();
  const [loading, setLoading] = useState<boolean>(true);
  const [
    metagenomicsIndexAssignmentResources,
    setMetagenomicsIndexAssignmentResources
  ] = useState<MetagenomicsIndexAssignmentResource[]>([]);
  const [materialSampleSummaries, setMaterialSamples] =
    useState<MaterialSampleSummary[]>();
  const [ngsIndexes, setNgsIndexes] = useState<NgsIndex[]>();
  const [protocol, setProtocol] = useState<Protocol>();

  useQuery<MetagenomicsBatchItem[]>(
    {
      include: "indexI5,indexI7,pcrBatchItem",
      page: { limit: 1000 },
      filter: filterBy([], {
        extraFilters: [
          {
            selector: "metagenomicsBatch.uuid",
            comparison: "==",
            arguments: metagenomicsBatch?.id ?? ""
          }
        ]
      })(""),
      path: `seqdb-api/metagenomics-batch-item`
    },
    {
      deps: [lastSave],
      parser: metagenomicsBatchItemParser,
      joinSpecs: [
        {
          apiBaseUrl: "/seqdb-api",
          idField: "pcrBatchItem.id",
          joinField: "pcrBatchItem",
          parser: pcrBatchItemParser,
          path: (metagenomicsBatchItem: MetagenomicsBatchItem) =>
            `pcr-batch-item/${metagenomicsBatchItem.pcrBatchItem?.id}?include=materialSample,storageUnitUsage`
        }
      ],
      async onSuccess(response) {
        /**
         * Fetch Storage Unit Usage linked to each Library Prep along with the material sample.
         * @returns
         */
        async function fetchStorageUnitUsage(
          metagenomicsBatchItems: MetagenomicsBatchItem[]
        ): Promise<MetagenomicsIndexAssignmentResource[]> {
          const paths = metagenomicsBatchItems
            .filter((item) => item.pcrBatchItem?.storageUnitUsage?.id)
            .map(
              (item) =>
                "/storage-unit-usage/" + item.pcrBatchItem?.storageUnitUsage?.id
            );
          const storageUnitUsageQuery = await bulkGet<StorageUnitUsage>(paths, {
            apiBaseUrl: "/collection-api"
          });

          return metagenomicsBatchItems.map((metagenomicsBatchItem) => {
            const queryStorageUnitUsage = storageUnitUsageQuery.find(
              (storageUnitUsage) =>
                storageUnitUsage?.id ===
                metagenomicsBatchItem.pcrBatchItem?.storageUnitUsage?.id
            );
            return {
              ...metagenomicsBatchItem,
              storageUnitUsage: queryStorageUnitUsage as StorageUnitUsage
            };
          });
        }

        async function fetchMaterialSamples(
          metagenomicsBatchItems: MetagenomicsIndexAssignmentResource[]
        ): Promise<MaterialSampleSummary[]> {
          const materialSampleQuery = await bulkGet<MaterialSampleSummary>(
            metagenomicsBatchItems
              .filter((item) => item?.pcrBatchItem?.materialSample?.id)
              .map(
                (item) =>
                  "/material-sample-summary/" +
                  item?.pcrBatchItem?.materialSample?.id
              ),
            {
              apiBaseUrl: "/collection-api"
            }
          );
          return materialSampleQuery as MaterialSampleSummary[];
        }
        let fetchedMetagenomicsIndexAssignmentResources =
          await fetchStorageUnitUsage(response.data);
        const materialSampleItems = await fetchMaterialSamples(
          fetchedMetagenomicsIndexAssignmentResources
        );

        // Add materialSampleSummary to each resource
        fetchedMetagenomicsIndexAssignmentResources =
          fetchedMetagenomicsIndexAssignmentResources.map(
            (metagenomicsBatchItem) => {
              const materialSampleSummary = materialSampleItems.find(
                (msSummary) =>
                  msSummary.id ===
                  metagenomicsBatchItem.pcrBatchItem?.materialSample?.id
              );
              return {
                ...metagenomicsBatchItem,
                materialSampleSummary
              };
            }
          );
        setMetagenomicsIndexAssignmentResources(
          fetchedMetagenomicsIndexAssignmentResources
        );
        setMaterialSamples(materialSampleItems);
        setLoading(false);
      }
    }
  );

  useQuery<NgsIndex[]>(
    {
      page: { limit: 1000 },
      filter: filterBy([], {
        extraFilters: [
          {
            selector: "indexSet.uuid",
            comparison: "==",
            arguments: metagenomicsBatch?.indexSet?.id ?? ""
          }
        ]
      })(""),
      path: `seqdb-api/ngs-index`
    },
    {
      deps: [lastSave],
      parser: ngsIndexParser,
      async onSuccess(response) {
        setNgsIndexes(response.data as NgsIndex[]);
      },
      disabled: !metagenomicsBatch?.indexSet?.id
    }
  );

  useQuery<Protocol>(
    {
      page: { limit: 1 },
      path: `collection-api/protocol/${metagenomicsBatch?.protocol?.id}`
    },
    {
      async onSuccess(response) {
        setProtocol(response.data as Protocol);
      },
      disabled: !metagenomicsBatch?.protocol?.id
    }
  );

  useEffect(() => {
    if (!pcrBatch || !pcrBatch.storageUnit) return;

    async function fetchStorageUnitTypeLayout() {
      const storageUnitReponse = await apiClient.get<StorageUnit>(
        `/collection-api/storage-unit/${pcrBatch?.storageUnit?.id}`,
        { include: "storageUnitType" }
      );
      if (storageUnitReponse?.data.storageUnitType?.gridLayoutDefinition) {
        setStorageUnitType(storageUnitReponse?.data.storageUnitType);
      }
    }
    fetchStorageUnitTypeLayout();
  }, [metagenomicsIndexAssignmentResources]);

  /**
   * Index Grid Form Submit
   *
   * Columns can set the i7 for each cell in that column and rows can set the i5 index for each
   * cell in that row.
   *
   * @param submittedValues Formik form data - Indicates the row/column and the index to set.
   */
  async function onSubmitGrid({ submittedValues }: DinaFormSubmitParams<any>) {
    // Do not perform a submit if not in edit mode.
    if (!editMode) {
      return;
    }

    const resourcesToSave = metagenomicsIndexAssignmentResources
      ? metagenomicsIndexAssignmentResources
      : [];
    const { indexI5s, indexI7s } = submittedValues;

    const edits: Dictionary<Partial<MetagenomicsIndexAssignmentResource>> = {};

    // Get the new i7 values:
    const colIndexes = _.toPairs<string>(indexI7s);
    for (const [col, index] of colIndexes) {
      const colResources = resourcesToSave.filter(
        (it) => String(it?.storageUnitUsage?.wellColumn) === col
      );
      for (const metagenicsIndexAssignmentResource of colResources) {
        if (metagenicsIndexAssignmentResource.id) {
          const edit = edits[metagenicsIndexAssignmentResource.id] || {};
          edit.indexI7 = { id: index, type: "ngs-index" } as NgsIndex;
          edits[metagenicsIndexAssignmentResource.id] = edit;
        }
      }
    }

    // Get the new i5 values:
    const rowIndexes = _.toPairs<string>(indexI5s);
    for (const [row, index] of rowIndexes) {
      const rowPreps = resourcesToSave.filter(
        (it) => it?.storageUnitUsage?.wellRow === row
      );
      for (const prep of rowPreps) {
        if (prep.id) {
          const edit = edits[prep.id] || {};
          edit.indexI5 = { id: index, type: "ngs-index" } as NgsIndex;
          edits[prep.id] = edit;
        }
      }
    }

    const saveOps: SaveArgs[] = _.toPairs(edits).map(([id, prepEdit]) => ({
      resource: { id, type: "metagenomics-batch-item", ...prepEdit },
      type: "metagenomics-batch-item"
    }));

    await save(saveOps, { apiBaseUrl: "/seqdb-api" });
    setLastSave(Date.now());
    setPerformSave?.(false);
    setEditMode?.(false);
    await onSaved?.(6);
  }

  /**
   * Table index assignment submit. This form lets you set the i5/i7 indexes for each library
   * prep individually.
   *
   * @param submittedValues Formik form data
   */
  async function onSubmitTable({ submittedValues }: DinaFormSubmitParams<any>) {
    // Do not perform a submit if not in edit mode.
    if (!editMode) {
      return;
    }

    // Library preps must be loaded in.
    if (
      !metagenomicsIndexAssignmentResources ||
      metagenomicsIndexAssignmentResources.length === 0 ||
      !submittedValues.indexAssignment ||
      submittedValues.indexAssignment.length === 0
    ) {
      return;
    }

    const indexAssignmentUpdates = (submittedValues?.indexAssignment as any[])
      ?.map<MetagenomicsBatchItem>(
        (submittedValue: any, index: number) =>
          ({
            type: "metagenomics-batch-item",
            id: metagenomicsIndexAssignmentResources[index].id,
            ...(!_.isEqual(
              metagenomicsIndexAssignmentResources[index]?.indexI5?.id,
              submittedValue.indexI5
            ) && {
              indexI5: {
                type: "ngs-index",
                id: submittedValue.indexI5 ? submittedValue.indexI5 : null
              }
            }),
            ...(!_.isEqual(
              metagenomicsIndexAssignmentResources[index]?.indexI7?.id,
              submittedValue.indexI7
            ) && {
              indexI7: {
                type: "ngs-index",
                id: submittedValue.indexI7 ? submittedValue.indexI7 : null
              }
            })
          } as MetagenomicsBatchItem)
      )
      ?.filter(
        (update: any) =>
          update.indexI5 !== undefined || update.indexI7 !== undefined
      );

    if (indexAssignmentUpdates.length !== 0) {
      const saveArgs = indexAssignmentUpdates.map((resource) => ({
        resource,
        type: "metagenomics-batch-item"
      }));

      await save(saveArgs, { apiBaseUrl: "/seqdb-api" });
      setLastSave(Date.now());
    }

    setPerformSave?.(false);
    setEditMode?.(false);
    await onSaved?.(6);
  }

  return {
    loading,
    metagenomicsIndexAssignmentResources,
    materialSampleSummaries,
    ngsIndexes,
    storageUnitType,
    protocol,
    onSubmitGrid,
    onSubmitTable
  };
}
