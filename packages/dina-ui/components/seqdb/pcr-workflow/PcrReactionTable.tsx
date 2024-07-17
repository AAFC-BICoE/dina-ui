import { ColumnDef } from "@tanstack/react-table";
import {
  AutoSuggestTextField,
  FieldHeader,
  ReactTable,
  filterBy,
  useApiClient,
  useDinaFormContext,
  useStringComparator
} from "common-ui";
import { PersistedResource } from "kitsu";
import { sortBy, compact } from "lodash";
import { useEffect, useState } from "react";
import { MaterialSampleSummary } from "../../../types/collection-api";
import {
  PcrBatchItem,
  PcrBatchItemDropdownResults,
  pcrBatchItemResultColor
} from "../../../types/seqdb-api";
import { getDeterminations } from "../../collection/material-sample/organismUtils";
import { StorageUnitUsage } from "packages/dina-ui/types/collection-api/resources/StorageUnitUsage";

export function usePcrReactionData(pcrBatchId?: string) {
  const [pcrBatchItems, setPcrBatchItems] = useState<PcrBatchItem[]>([]);
  const [materialSampleSummaries, setMaterialSampleSummaries] = useState<
    MaterialSampleSummary[]
  >([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { compareByStringAndNumber } = useStringComparator();

  const { apiClient, bulkGet } = useApiClient();

  // Initial fetch, should refetch between edit modes.
  useEffect(() => {
    fetchPcrBatchItems();
  }, [pcrBatchId]);

  function fetchPcrBatchItems() {
    if (!pcrBatchId) {
      setLoading(false);
    } else {
      setLoading(true);
      apiClient
        .get<PcrBatchItem[]>("seqdb-api/pcr-batch-item", {
          filter: filterBy([], {
            extraFilters: [
              {
                selector: "pcrBatch.uuid",
                comparison: "==",
                arguments: pcrBatchId
              }
            ]
          })(""),
          include: "materialSample,storageUnitUsage",
          page: {
            limit: 1000 // Maximum page limit
          }
        })
        .then(async (response) => {
          const batchItems: PersistedResource<PcrBatchItem>[] =
            response.data?.filter(
              (item) => item?.materialSample?.id !== undefined
            );
          await fetchMaterialSamples(batchItems);
        });
    }
  }

  async function fetchMaterialSamples(
    batchItems: PersistedResource<PcrBatchItem>[]
  ) {
    if (!batchItems || batchItems.length === 0) {
      setLoading(false);
      return;
    }
    let processedPcrBatchItems: PcrBatchItem[] = [];
    const fetchedStorageUnitUsages = await bulkGet<StorageUnitUsage>(
      batchItems.map(
        (item) => "/storage-unit-usage/" + item?.storageUnitUsage?.id
      ),
      {
        apiBaseUrl: "/collection-api",
        returnNullForMissingResource: true
      }
    );
    processedPcrBatchItems = batchItems.map((batchItem) => ({
      ...batchItem,
      storageUnitUsage: fetchedStorageUnitUsages.find(
        (fetchedStorageUnitUsage) =>
          fetchedStorageUnitUsage.id === batchItem.storageUnitUsage?.id
      )
    }));

    const fetchedMaterialSampleSummary = await bulkGet<MaterialSampleSummary>(
      batchItems.map(
        (item) => "/material-sample-summary/" + item?.materialSample?.id
      ),
      {
        apiBaseUrl: "/collection-api",
        returnNullForMissingResource: true
      }
    );
    const sampleSummaries = compact(fetchedMaterialSampleSummary ?? []);
    processedPcrBatchItems = processedPcrBatchItems.filter(
      (item) =>
        !!sampleSummaries.find(
          (sample) =>
            item.materialSample?.id && sample.id === item.materialSample?.id
        )
    );

    sortPcrBatchItems(processedPcrBatchItems, sampleSummaries);
    setPcrBatchItems(processedPcrBatchItems);
    setMaterialSampleSummaries(sampleSummaries);
    setLoading(false);
  }

  function sortPcrBatchItems(
    items: PcrBatchItem[],
    samples: MaterialSampleSummary[]
  ) {
    if (items) {
      items.sort((a, b) => {
        const sampleName1 =
          samples.find((sample) => sample?.id === a.materialSample?.id)
            ?.materialSampleName ?? "";
        const sampleName2 =
          samples.find((sample) => sample?.id === b.materialSample?.id)
            ?.materialSampleName ?? "";
        return compareByStringAndNumber(sampleName1, sampleName2);
      });
    }
  }

  return {
    pcrBatchItems,
    setPcrBatchItems,
    materialSamples: materialSampleSummaries,
    loading
  };
}

export interface PcrReactionTableProps {
  pcrBatchItems: PcrBatchItem[];
  materialSamples: MaterialSampleSummary[];
  readOnlyOverride?: boolean;
}

export function PcrReactionTable({
  pcrBatchItems,
  materialSamples,
  readOnlyOverride = false
}: PcrReactionTableProps) {
  const { readOnly } = useDinaFormContext();

  const PCR_REACTION_COLUMN: ColumnDef<PcrBatchItem>[] = [
    {
      id: "wellCoordinates",
      cell: ({ row }) => (
        <>
          {row.original?.storageUnitUsage?.wellRow === null ||
          row.original?.storageUnitUsage?.wellColumn === null
            ? ""
            : `${row.original.storageUnitUsage?.wellRow}${row.original.storageUnitUsage?.wellColumn}`}
        </>
      ),
      header: () => <FieldHeader name={"wellCoordinates"} />
    },
    {
      id: "tubeNumber",
      cell: ({ row: { original } }) =>
        original?.storageUnitUsage?.cellNumber === undefined ? (
          <></>
        ) : (
          <>{original.storageUnitUsage?.cellNumber}</>
        ),
      header: () => <FieldHeader name={"tubeNumber"} />
    },
    {
      id: "materialSampleName",
      cell: ({ row: { original } }) => {
        const fetchedMaterialSample = materialSamples.find(
          (materialSample) =>
            materialSample?.id === original?.materialSample?.id
        );
        if (!fetchedMaterialSample) return <></>;
        return <p>{fetchedMaterialSample.materialSampleName}</p>;
      },
      header: () => <FieldHeader name={"materialSampleName"} />
    },
    {
      id: "scientificName",
      cell: ({ row: { original } }) => {
        const fetchedMaterialSample = materialSamples.find(
          (materialSample) =>
            materialSample?.id === original?.materialSample?.id
        );
        if (!fetchedMaterialSample) return <></>;
        const scientificName = getDeterminations(
          fetchedMaterialSample.effectiveDeterminations
        );
        return <>{scientificName}</>;
      },
      header: () => <FieldHeader name={"scientificName"} />
    },
    {
      id: "result",
      cell: ({ row: { original } }) => {
        return !(readOnlyOverride || readOnly) ? (
          <div>
            <AutoSuggestTextField
              name={"results[" + original?.id + "]"}
              hideLabel={true}
              removeBottomMargin={true}
              customOptions={(searchTerm, _) => {
                return Object.values(PcrBatchItemDropdownResults).filter(
                  (resultString) =>
                    searchTerm
                      ? resultString
                          .toLowerCase()
                          .startsWith(searchTerm.toLowerCase())
                      : true
                );
              }}
              blankSearchBackend={"json-api"}
            />
          </div>
        ) : (
          <div
            style={{
              backgroundColor: "#" + pcrBatchItemResultColor(original?.result),
              borderRadius: "5px",
              paddingLeft: "5px"
            }}
          >
            {original?.result ?? ""}
          </div>
        );
      },
      header: () => <FieldHeader name={"result"} />
    }
  ];

  return (
    <ReactTable<PcrBatchItem>
      className="-striped react-table-overflow"
      columns={PCR_REACTION_COLUMN}
      data={sortBy(pcrBatchItems, "cellNumber")}
      showPagination={false}
      manualPagination={true}
      enableSorting={false}
    />
  );
}
