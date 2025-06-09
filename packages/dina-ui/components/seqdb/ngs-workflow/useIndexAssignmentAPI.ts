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
import { IndexAssignmentStepProps } from "./IndexAssignmentStep";
import { LibraryPrep, NgsIndex } from "packages/dina-ui/types/seqdb-api";

export interface UseIndexAssignmentReturn {
  libraryPrepsLoading: boolean;
  libraryPreps?: LibraryPrep[];
  materialSamples?: MaterialSampleSummary[];
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

export function useIndexAssignmentAPI({
  batch: libraryPrepBatch,
  editMode,
  setEditMode,
  setPerformSave
}: Partial<IndexAssignmentStepProps>): UseIndexAssignmentReturn {
  const { save, apiClient, bulkGet } = useContext(ApiClientContext);

  const [lastSave, setLastSave] = useState<number>();

  const [storageUnitType, setStorageUnitType] = useState<StorageUnitType>();
  const [libraryPrepsLoading, setLibraryPrepsLoading] = useState<boolean>(true);
  const [libraryPreps, setLibraryPreps] = useState<LibraryPrep[]>();
  const [materialSamples, setMaterialSamples] =
    useState<MaterialSampleSummary[]>();
  const [ngsIndexes, setNgsIndexes] = useState<NgsIndex[]>();
  const [protocol, setProtocol] = useState<Protocol>();

  useQuery<LibraryPrep[]>(
    {
      include: "indexI5,indexI7,storageUnitUsage,materialSample",
      page: { limit: 1000 },
      filter: filterBy([], {
        extraFilters: [
          {
            selector: "libraryPrepBatch.uuid",
            comparison: "==",
            arguments: libraryPrepBatch?.id ?? ""
          }
        ]
      })(""),
      path: `seqdb-api/library-prep`
    },
    {
      deps: [lastSave],
      async onSuccess(response) {
        /**
         * Fetch Storage Unit Usage linked to each Library Prep along with the material sample.
         * @returns
         */
        async function fetchStorageUnitUsage(
          libraryPrepsArray: LibraryPrep[]
        ): Promise<LibraryPrep[]> {
          const storageUnitUsageQuery = await bulkGet<StorageUnitUsage>(
            libraryPrepsArray
              .filter((item) => item.storageUnitUsage?.id)
              .map(
                (item) => "/storage-unit-usage/" + item.storageUnitUsage?.id
              ),
            {
              apiBaseUrl: "/collection-api"
            }
          );

          return libraryPrepsArray.map((ngsSample) => {
            const queryStorageUnitUsage = storageUnitUsageQuery.find(
              (storageUnitUsage) =>
                storageUnitUsage?.id === ngsSample.storageUnitUsage?.id
            );
            return {
              ...ngsSample,
              storageUnitUsage: queryStorageUnitUsage as StorageUnitUsage
            };
          });
        }

        async function fetchMaterialSamples(
          libraryPrepsArray: LibraryPrep[]
        ): Promise<MaterialSampleSummary[]> {
          const materialSampleQuery = await bulkGet<MaterialSampleSummary>(
            libraryPrepsArray
              .filter((item) => item?.materialSample?.id)
              .map(
                (item) => "/material-sample-summary/" + item?.materialSample?.id
              ),
            {
              apiBaseUrl: "/collection-api"
            }
          );

          return materialSampleQuery as MaterialSampleSummary[];
        }

        const libraryPrepItems = await fetchStorageUnitUsage(response.data);
        const materialSampleItems = await fetchMaterialSamples(
          libraryPrepItems
        );

        setLibraryPreps(libraryPrepItems);
        setMaterialSamples(materialSampleItems);
        setLibraryPrepsLoading(false);
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
            arguments: libraryPrepBatch?.indexSet?.id ?? ""
          }
        ]
      })(""),
      path: `seqdb-api/ngs-index`
    },
    {
      deps: [lastSave],
      async onSuccess(response) {
        setNgsIndexes(response.data as NgsIndex[]);
      },
      disabled: !libraryPrepBatch?.indexSet?.id
    }
  );

  useQuery<Protocol>(
    {
      page: { limit: 1 },
      path: `collection-api/protocol/${libraryPrepBatch?.protocol?.id}`
    },
    {
      async onSuccess(response) {
        setProtocol(response.data as Protocol);
      },
      disabled: !libraryPrepBatch?.protocol?.id
    }
  );

  useEffect(() => {
    if (!libraryPrepBatch || !libraryPrepBatch.storageUnit) return;

    async function fetchStorageUnitTypeLayout() {
      const storageUnitReponse = await apiClient.get<StorageUnit>(
        `/collection-api/storage-unit/${libraryPrepBatch?.storageUnit?.id}`,
        { include: "storageUnitType" }
      );
      if (storageUnitReponse?.data.storageUnitType?.gridLayoutDefinition) {
        setStorageUnitType(storageUnitReponse?.data.storageUnitType);
      }
    }
    fetchStorageUnitTypeLayout();
  }, [libraryPrepBatch]);

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

    const libraryPrepsToSave = libraryPreps ? libraryPreps : [];
    const { indexI5s, indexI7s } = submittedValues;

    const edits: Dictionary<Partial<LibraryPrep>> = {};

    // Get the new i7 values:
    const colIndexes = _.toPairs<string>(indexI7s);
    for (const [col, index] of colIndexes) {
      const colPreps = libraryPrepsToSave.filter(
        (it) => String(it?.storageUnitUsage?.wellColumn) === col
      );
      for (const prep of colPreps) {
        if (prep.id) {
          const edit = edits[prep.id] || {};
          edit.indexI7 = { id: index, type: "ngs-index" } as NgsIndex;
          edits[prep.id] = edit;
        }
      }
    }

    // Get the new i5 values:
    const rowIndexes = _.toPairs<string>(indexI5s);
    for (const [row, index] of rowIndexes) {
      const rowPreps = libraryPrepsToSave.filter(
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
      resource: { id, type: "library-prep", ...prepEdit },
      type: "library-prep"
    }));

    await save(saveOps, { apiBaseUrl: "/seqdb-api" });
    setLastSave(Date.now());
    setPerformSave?.(false);
    setEditMode?.(false);
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
      !libraryPreps ||
      libraryPreps.length === 0 ||
      !submittedValues.libraryPrep ||
      submittedValues.libraryPrep.length === 0
    ) {
      return;
    }

    const libraryPrepUpdates = (submittedValues?.libraryPrep as any[])
      ?.map<LibraryPrep>(
        (submittedValue: any, index: number) =>
          ({
            type: "library-prep",
            id: libraryPreps[index].id,
            ...(!_.isEqual(
              libraryPreps[index]?.indexI5?.id,
              submittedValue.indexI5
            ) && {
              indexI5: {
                type: "ngs-index",
                id: submittedValue.indexI5 ? submittedValue.indexI5 : null
              }
            }),
            ...(!_.isEqual(
              libraryPreps[index]?.indexI7?.id,
              submittedValue.indexI7
            ) && {
              indexI7: {
                type: "ngs-index",
                id: submittedValue.indexI7 ? submittedValue.indexI7 : null
              }
            })
          } as LibraryPrep)
      )
      ?.filter(
        (update: any) =>
          update.indexI5 !== undefined || update.indexI7 !== undefined
      );

    if (libraryPrepUpdates.length !== 0) {
      const saveArgs = libraryPrepUpdates.map((resource) => ({
        resource,
        type: "library-prep"
      }));

      await save(saveArgs, { apiBaseUrl: "/seqdb-api" });
      setLastSave(Date.now());
    }

    setPerformSave?.(false);
    setEditMode?.(false);
  }

  return {
    libraryPrepsLoading,
    libraryPreps,
    materialSamples,
    ngsIndexes,
    storageUnitType,
    protocol,
    onSubmitGrid,
    onSubmitTable
  };
}
