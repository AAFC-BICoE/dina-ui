import { ApiClientContext, safeSubmit, SaveArgs, useQuery } from "common-ui";
import { Dictionary, toPairs } from "lodash";
import { useContext, useState } from "react";
import { LibraryPrep, PcrPrimer } from "../../../../types/seqdb-api";
import { IndexGridProps } from "./IndexGrid";

export function useIndexGridControls({ libraryPrepBatch }: IndexGridProps) {
  const { save } = useContext(ApiClientContext);

  const [lastSave, setLastSave] = useState<number>();

  const {
    loading: libraryPrepsLoading,
    response: libraryPrepsResponse
  } = useQuery<LibraryPrep[]>(
    {
      fields: {
        pcrPrimer: "name",
        sample: "name"
      },
      include: "sample,indexI5,indexI7",
      page: { limit: 1000 },
      path: `libraryPrepBatch/${libraryPrepBatch.id}/libraryPreps`
    },
    {
      deps: [lastSave]
    }
  );

  const onSubmit = safeSubmit(async values => {
    const libraryPreps = libraryPrepsResponse.data;
    const { indexI5s, indexI7s } = values;

    const edits: Dictionary<Partial<LibraryPrep>> = {};

    // Get the new i5 values:
    const colPrimers = toPairs<PcrPrimer>(indexI5s);
    for (const [col, primer] of colPrimers) {
      const colPreps = libraryPreps.filter(it => String(it.wellColumn) === col);
      for (const prep of colPreps) {
        const edit = edits[prep.id] || {};
        edit.indexI5 = { id: primer.id, type: "pcrPrimer" } as PcrPrimer;
        edits[prep.id] = edit;
      }
    }

    // Get the new i7 values:
    const rowPrimers = toPairs<PcrPrimer>(indexI7s);
    for (const [row, primer] of rowPrimers) {
      const rowPreps = libraryPreps.filter(it => it.wellRow === row);
      for (const prep of rowPreps) {
        const edit = edits[prep.id] || {};
        edit.indexI7 = { id: primer.id, type: "pcrPrimer" } as PcrPrimer;
        edits[prep.id] = edit;
      }
    }

    const saveOps: SaveArgs[] = toPairs(edits).map(([id, prepEdit]) => ({
      resource: { id, type: "libraryPrep", ...prepEdit },
      type: "libraryPrep"
    }));

    await save(saveOps);

    setLastSave(Date.now());
  });

  return { libraryPrepsLoading, libraryPrepsResponse, onSubmit };
}
