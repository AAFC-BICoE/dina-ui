import {
  PcrBatchItem,
  PcrBatchItemDropdownResults,
  pcrBatchItemResultColor
} from "../../../types/seqdb-api";
import { useState, useEffect, useRef, Ref } from "react";
import {
  filterBy,
  FieldHeader,
  useApiClient,
  DinaForm,
  LoadingSpinner,
  Operation,
  AutoSuggestTextField
} from "common-ui";
import ReactTable, { Column } from "react-table";
import { MaterialSample } from "../../../types/collection-api";
import { FormikProps } from "formik";
import { sortBy } from "lodash";
import { PersistedResource } from "kitsu";
import { getScientificNames } from "../../collection/material-sample/organismUtils";

export interface SangerPcrReactionProps {
  pcrBatchId: string;
  editMode: boolean;
  setEditMode?: (newValue: boolean) => void;
  performSave: boolean;
  setPerformSave: (newValue: boolean) => void;
}

export function SangerPcrReactionStep({
  pcrBatchId,
  editMode,
  setEditMode,
  performSave,
  setPerformSave
}: SangerPcrReactionProps) {
  const { apiClient, bulkGet, doOperations } = useApiClient();

  const formRef: Ref<FormikProps<Partial<PcrBatchItem>>> = useRef(null);

  const [loading, setLoading] = useState<boolean>(true);

  const [selectedResources, setSelectedResources] = useState<PcrBatchItem[]>(
    []
  );
  const [materialSamples, setMaterialSamples] = useState<MaterialSample[]>([]);

  // Initial fetch, should refetch between edit modes.
  useEffect(() => {
    setLoading(true);
    fetchPcrBatchItems();
  }, [editMode]);

  // Once the pcr batch items have been loaded, fetch the material samples as well.
  useEffect(() => {
    if (selectedResources.length !== 0) {
      fetchMaterialSamples();
    } else {
      setLoading(false);
    }
  }, [selectedResources]);

  // Check if a save was requested from the top level button bar.
  useEffect(() => {
    if (performSave && !!pcrBatchId) {
      performSaveInternal();
    }
  }, [performSave]);

  function fetchPcrBatchItems() {
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
        include: "materialSample"
      })
      .then((response) => {
        const pcrBatchItems: PersistedResource<PcrBatchItem>[] =
          response.data?.filter(
            (item) => item?.materialSample?.id !== undefined
          );
        setSelectedResources(pcrBatchItems);
      });
  }

  function fetchMaterialSamples() {
    if (!selectedResources) return;

    bulkGet<MaterialSample>(
      selectedResources.map(
        (item) =>
          "/material-sample/" + item?.materialSample?.id + "?include=organism"
      ),
      { apiBaseUrl: "/collection-api" }
    ).then((response) => {
      setMaterialSamples(response);
      setLoading(false);
    });
  }

  async function performSaveInternal() {
    if (formRef && (formRef as any)?.current?.values?.results) {
      const results = (formRef as any)?.current.values.results;

      const resultsWithId = Object.keys(results).map((id) => ({
        id,
        value: results[id]
      }));

      // Using the results, generate the operations.
      const operations = resultsWithId.map<Operation>((result) => ({
        op: "PATCH",
        path: "pcr-batch-item/" + result.id,
        value: {
          id: result.id,
          type: "pcr-batch-item",
          attributes: {
            result: result.value
          }
        }
      }));

      await doOperations(operations, { apiBaseUrl: "/seqdb-api" });
    }

    // Leave edit mode...
    setPerformSave(false);
    if (!!setEditMode) {
      setEditMode(false);
    }
  }

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
        return editMode ? (
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

  // Wait until the PcrBatchItems have been loaded in before displaying the table.
  if (loading) {
    return <LoadingSpinner loading={true} />;
  }

  // Load the result based on the API request with the pcr-batch-item.
  const initialValues = {
    results: Object.fromEntries(
      selectedResources.map((obj) => [obj.id, obj.result])
    )
  };

  return (
    <DinaForm<Partial<PcrBatchItem>>
      initialValues={initialValues as any}
      innerRef={formRef}
      readOnly={!editMode}
    >
      <ReactTable<PcrBatchItem>
        className="react-table-overflow"
        columns={PCR_REACTION_COLUMN}
        data={sortBy(selectedResources, "cellNumber")}
        minRows={1}
        showPagination={false}
        sortable={false}
      />
    </DinaForm>
  );
}
