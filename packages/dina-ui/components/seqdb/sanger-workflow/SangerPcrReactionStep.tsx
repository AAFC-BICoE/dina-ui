import {
  PcrBatchItem,
  PCR_BATCH_ITEM_RESULT_INFO
} from "../../../types/seqdb-api";
import { useState, useEffect, useRef, Ref } from "react";
import {
  filterBy,
  FieldHeader,
  useApiClient,
  DinaForm,
  LoadingSpinner,
  SelectField,
  SelectOption,
  Operation
} from "common-ui";
import ReactTable, { Column } from "react-table";
import {
  MaterialSample,
  Determination,
  Organism
} from "../../../types/collection-api";
import { FormikProps } from "formik";

export interface SangerPcrReactionProps {
  pcrBatchId: string;
  editMode: boolean;
  setEditMode: (newValue: boolean) => void;
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
  const [determination, setDetermination] = useState<Determination>();

  // const [selectedResources, setSelectedResources] = useState<
  //   PcrBatchItemReactionStep[]
  // >([]);

  useEffect(() => {
    fetchPcrBatchItems();
    fetchDetermination();
  }, []);

  // useEffect(() => {
  // fetchMaterialSamples();
  // fetchPcrBatchItems();
  // }, [selectedResources]);

  // Check if a save was requested from the top level button bar.
  useEffect(() => {
    if (performSave) {
      performSaveInternal();
    }
  }, [performSave]);

  async function fetchDetermination() {
    await apiClient
      .get<MaterialSample[]>("/collection-api/material-sample", {
        filter: filterBy([], {
          extraFilters: [
            {
              selector: "pcrBatch.uuid",
              comparison: "==",
              arguments: pcrBatchId
            }
          ]
        })("")
      })
      .then((response) => {
        // console.log(response);
        // console.log("j");
        // const pcrBatchItems: PersistedResource<PcrBatchItem>[] =
        //   response.data?.filter(
        //     (item) => item?.materialSample?.id !== undefined
        //   );
        // setSelectedResources(response?.data);
      });
  }

  async function fetchPcrBatchItems() {
    await apiClient
      .get<PcrBatchItem[]>("/seqdb-api/pcr-batch-item", {
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
        // const pcrBatchItems: PersistedResource<PcrBatchItem>[] =
        //   response.data?.filter(
        //     (item) => item?.materialSample?.id !== undefined
        //   );

        setSelectedResources(response?.data);
        setLoading(false);
        // setSelectedResources(
        //   pcrBatchItems?.map<PcrBatchItemReactionStep>((item) => ({
        //     pcrBatchItem: item as any,
        //     determination: undefined,
        //     materialSample: undefined
        //   }))
        // );
      });
  }

  // async function fetchMaterialSamples() {
  //   if (!selectedResources) return;

  //   await bulkGet<MaterialSample>(
  //     selectedResources.map(
  //       (item) => "/material-sample/" + item.pcrBatchItem?.materialSample?.id
  //     ),
  //     { apiBaseUrl: "/collection-api" }
  //   ).then((response) => {
  //     // const materialSamplesTransformed = compact(response).map((resource) => ({
  //     //   data: {
  //     //     attributes: pick(resource, ["materialSampleName"])
  //     //   },
  //     //   id: resource.id,
  //     //   type: resource.type
  //     // }));
  //     // console.log("got here: " + JSON.stringify(response));
  //     // setSelectedResources(materialSamplesTransformed ?? []);
  //   });
  // }

  async function performSaveInternal() {
    if (formRef && (formRef as any)?.current?.values?.results) {
      // Currently the results look like this:
      // { "ec067d28-8a66-43a3-8193-eefe13dec4bb": "No Band" }
      const results = (formRef as any)?.current.values.results;

      // Transform to an array with the ids as well:
      // [{ id: "ec067d28-8a66-43a3-8193-eefe13dec4bb" value: "No Band" }]
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
    setEditMode(false);
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
      Cell: ({ original }) => (
        <a
          href={`/collection/material-sample/view?id=${original?.materialSample?.id}`}
        >
          {original?.materialSample?.attributes?.materialSampleName ||
            original?.attributes?.dwcOtherCatalogNumbers?.join?.(", ") ||
            original?.materialSample?.id}
        </a>
      ),
      Header: <FieldHeader name={"materialSampleName"} />,
      sortable: false
    },
    {
      Cell: ({ original }) => (
        // <a
        //   href={`/collection/material-sample/view?id=${original?.determination?.id}`}
        // >
        //   {original?.determination}
        // </a>
        <></>
      ),
      Header: <FieldHeader name={"scientificName"} />,
      sortable: false
    },
    {
      Cell: ({ original }) => (
        <SelectField
          name={"results[" + original?.id + "]"}
          hideLabel={true}
          options={PCR_BATCH_ITEM_RESULT_INFO.map<
            SelectOption<string | undefined>
          >((option) => ({ label: option.option, value: option.option }))}
        />
      ),
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
        columns={PCR_REACTION_COLUMN}
        defaultSorted={[{ id: "tubeNumber", desc: true }]}
        data={selectedResources}
        minRows={1}
        showPagination={false}
        sortable={false}
        style={{ overflow: "visible" }}
      />
    </DinaForm>
  );
}
