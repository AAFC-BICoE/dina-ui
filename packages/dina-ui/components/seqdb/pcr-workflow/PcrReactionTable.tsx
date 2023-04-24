import {
  AutoSuggestTextField,
  FieldHeader,
  filterBy,
  useApiClient,
  useDinaFormContext
} from "common-ui";
import { PersistedResource } from "kitsu";
import { sortBy } from "lodash";
import { useEffect, useState } from "react";
import ReactTable, { Column } from "react-table";
import { MaterialSample } from "../../../types/collection-api";
import {
  PcrBatchItem,
  PcrBatchItemDropdownResults,
  pcrBatchItemResultColor
} from "../../../types/seqdb-api";
import { getScientificNames } from "../../collection/material-sample/organismUtils";

export function usePcrReactionData(pcrBatchId?: string) {
  const [pcrBatchItems, setPcrBatchItems] = useState<PcrBatchItem[]>([]);
  const [materialSamples, setMaterialSamples] = useState<MaterialSample[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

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
          include: "materialSample",
          page: {
            limit: 1000 // Maximum page limit
          }
        })
        .then((response) => {
          const batchItems: PersistedResource<PcrBatchItem>[] =
            response.data?.filter(
              (item) => item?.materialSample?.id !== undefined
            );
          setPcrBatchItems(batchItems);
          fetchMaterialSamples(batchItems);
        });
    }
  }

  function fetchMaterialSamples(batchItems: PersistedResource<PcrBatchItem>[]) {
    if (!batchItems || batchItems.length === 0) {
      setLoading(false);
      return;
    }
    bulkGet<MaterialSample>(
      batchItems.map(
        (item) =>
          "/material-sample/" + item?.materialSample?.id + "?include=organism"
      ),
      { apiBaseUrl: "/collection-api" }
    ).then((response) => {
      setMaterialSamples(response);
      setLoading(false);
    });
  }

  return { pcrBatchItems, setPcrBatchItems, materialSamples, loading };
}

export interface PcrReactionTableProps {
  pcrBatchItems: PcrBatchItem[];
  materialSamples: MaterialSample[];
}

export function PcrReactionTable({
  pcrBatchItems,
  materialSamples
}: PcrReactionTableProps) {
  const { readOnly } = useDinaFormContext();

  const PCR_REACTION_COLUMN: Column<PcrBatchItem>[] = [
    {
      Cell: ({ original }) => {
        if (original?.wellRow === null || original?.wellColumn === null)
          return <></>;

        return <>{original.wellRow + "" + original.wellColumn}</>;
      },
      Header: <FieldHeader name={"wellCoordinates"} />,
      sortable: false
    },
    {
      Cell: ({ original }) => {
        if (original?.cellNumber === undefined) return <></>;

        return <>{original.cellNumber}</>;
      },
      id: "tubeNumber",
      Header: <FieldHeader name={"tubeNumber"} />,
      sortable: false
    },
    {
      Cell: ({ original }) => {
        const fetchedMaterialSample = materialSamples.find(
          (materialSample) => materialSample.id === original?.materialSample?.id
        );

        if (!fetchedMaterialSample) return <></>;

        return <p>{fetchedMaterialSample.materialSampleName}</p>;
      },
      Header: <FieldHeader name={"materialSampleName"} />,
      sortable: false
    },
    {
      Cell: ({ original }) => {
        const fetchedMaterialSample = materialSamples.find(
          (materialSample) => materialSample.id === original?.materialSample?.id
        );

        if (!fetchedMaterialSample) return <></>;

        return <>{getScientificNames(fetchedMaterialSample)}</>;
      },
      Header: <FieldHeader name={"scientificName"} />,
      sortable: false
    },
    {
      Cell: ({ original }) => {
        return !readOnly ? (
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
      Header: <FieldHeader name={"result"} />,
      sortable: false
    }
  ];

  return (
    <ReactTable<PcrBatchItem>
      className="react-table-overflow"
      columns={PCR_REACTION_COLUMN}
      data={sortBy(pcrBatchItems, "cellNumber")}
      minRows={1}
      pageSize={1000} // Maximum that the API will return.
      showPagination={false}
      sortable={false}
    />
  );
}
