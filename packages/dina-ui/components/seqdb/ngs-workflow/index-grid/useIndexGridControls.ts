import { ApiClientContext, safeSubmit, SaveArgs, useQuery } from "common-ui";
import { Dictionary, toPairs } from "lodash";
import { useContext, useState, useEffect } from "react";
import { LibraryPrep, NgsIndex } from "../../../../types/seqdb-api";
import { IndexGridProps } from "./IndexGrid";
import {
  StorageUnit,
  StorageUnitType
} from "packages/dina-ui/types/collection-api";

export function useIndexGridControls({ libraryPrepBatch }: IndexGridProps) {
  const { save, apiClient } = useContext(ApiClientContext);

  const [lastSave, setLastSave] = useState<number>();

  const [storageUnitType, setStorageUnitType] = useState<StorageUnitType>();

  const { loading: libraryPrepsLoading, response: libraryPrepsResponse } =
    useQuery<LibraryPrep[]>(
      {
        include: "indexI5,indexI7",
        page: { limit: 1000 },
        path: `seqdb-api/libraryPrepBatch/${libraryPrepBatch.id}/libraryPreps`
      },
      {
        deps: [lastSave]
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

  const onSubmit = safeSubmit(async (values) => {
    const libraryPreps = libraryPrepsResponse ? libraryPrepsResponse.data : [];
    const { indexI5s, indexI7s } = values;

    const edits: Dictionary<Partial<LibraryPrep>> = {};

    // Get the new i7 values:
    const colIndexes = toPairs<NgsIndex>(indexI7s);
    for (const [col, index] of colIndexes) {
      const colPreps = libraryPreps.filter(
        (it) => String(it?.storageUnitUsage?.wellColumn) === col
      );
      for (const prep of colPreps) {
        if (prep.id) {
          const edit = edits[prep.id] || {};
          edit.indexI7 = { id: index.id, type: "ngsIndex" } as NgsIndex;
          edits[prep.id] = edit;
        }
      }
    }

    // Get the new i5 values:
    const rowIndexes = toPairs<NgsIndex>(indexI5s);
    for (const [row, index] of rowIndexes) {
      const rowPreps = libraryPreps.filter(
        (it) => it?.storageUnitUsage?.wellRow === row
      );
      for (const prep of rowPreps) {
        if (prep.id) {
          const edit = edits[prep.id] || {};
          edit.indexI5 = { id: index.id, type: "ngsIndex" } as NgsIndex;
          edits[prep.id] = edit;
        }
      }
    }

    const saveOps: SaveArgs[] = toPairs(edits).map(([id, prepEdit]) => ({
      resource: { id, type: "libraryPrep", ...prepEdit },
      type: "libraryPrep"
    }));

    await save(saveOps, { apiBaseUrl: "/seqdb-api" });

    setLastSave(Date.now());
  });

  return {
    libraryPrepsLoading,
    libraryPrepsResponse,
    storageUnitType,
    onSubmit
  };
}
