import {
  ApiClientContext,
  DinaFormSubmitParams,
  filterBy,
  SaveArgs,
  useQuery
} from "common-ui";
import { Dictionary, toPairs } from "lodash";
import { useContext, useState, useEffect } from "react";
import { LibraryPrep, NgsIndex } from "../../../../types/seqdb-api";
import {
  MaterialSample,
  StorageUnit,
  StorageUnitType
} from "packages/dina-ui/types/collection-api";
import { StorageUnitUsage } from "packages/dina-ui/types/collection-api/resources/StorageUnitUsage";
import { IndexAssignmentStepProps } from "../IndexAssignmentStep";

export function useIndexGridControls({
  batch: libraryPrepBatch,
  editMode,
  setEditMode,
  setPerformSave
}: IndexAssignmentStepProps) {
  const { save, apiClient, bulkGet } = useContext(ApiClientContext);

  const [lastSave, setLastSave] = useState<number>();

  const [storageUnitType, setStorageUnitType] = useState<StorageUnitType>();

  const [libraryPrepsLoading, setLibraryPrepsLoading] = useState<boolean>(true);
  const [libraryPreps, setLibraryPreps] = useState<LibraryPrep[]>();
  const [materialSamples, setMaterialSamples] = useState<MaterialSample[]>();
  const [ngsIndexes, setNgsIndexes] = useState<NgsIndex[]>();

  useQuery<LibraryPrep[]>(
    {
      include: "indexI5,indexI7,storageUnitUsage,materialSample",
      page: { limit: 1000 },
      filter: filterBy([], {
        extraFilters: [
          {
            selector: "libraryPrepBatch.uuid",
            comparison: "==",
            arguments: libraryPrepBatch.id ?? ""
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
        ): Promise<MaterialSample[]> {
          const materialSampleQuery = await bulkGet<MaterialSample>(
            libraryPrepsArray
              .filter((item) => item?.materialSample?.id)
              .map((item) => "/material-sample/" + item?.materialSample?.id),
            {
              apiBaseUrl: "/collection-api"
            }
          );

          return materialSampleQuery as MaterialSample[];
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

  async function onSubmit({ submittedValues }: DinaFormSubmitParams<any>) {
    // Do not perform a submit if not in edit mode.
    if (!editMode) {
      return;
    }

    const libraryPrepsToSave = libraryPreps ? libraryPreps : [];
    const { indexI5s, indexI7s } = submittedValues;

    const edits: Dictionary<Partial<LibraryPrep>> = {};

    // Get the new i7 values:
    const colIndexes = toPairs<string>(indexI7s);
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
    const rowIndexes = toPairs<string>(indexI5s);
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

    const saveOps: SaveArgs[] = toPairs(edits).map(([id, prepEdit]) => ({
      resource: { id, type: "library-prep", ...prepEdit },
      type: "library-prep"
    }));

    await save(saveOps, { apiBaseUrl: "/seqdb-api" });
    setLastSave(Date.now());
    setPerformSave(false);
    setEditMode(false);
  }

  return {
    libraryPrepsLoading,
    libraryPreps,
    materialSamples,
    ngsIndexes,
    storageUnitType,
    onSubmit
  };
}
