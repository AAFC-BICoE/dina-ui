import { PersistedResource } from "kitsu";
import { PcrBatch, PcrBatchItem } from "../../../types/seqdb-api";
import { useState, useEffect } from "react";
import {
  filterBy,
  FieldHeader,
  useApiClient,
  DinaForm,
  LoadingSpinner
} from "common-ui";
import ReactTable, { Column } from "react-table";
import { MaterialSample, Determination } from "../../../types/collection-api";

// interface PcrBatchItemReactionStep {
// pcrBatchItem: PcrBatchItem;
// materialSample?: MaterialSample;
// determination?: Determination;
// }

export interface SangerPcrReactionProps {
  pcrBatchId: string;
  pcrBatch?: PcrBatch;
  editMode: boolean;
  setEditMode: (newValue: boolean) => void;
  performSave: boolean;
  setPerformSave: (newValue: boolean) => void;
}

export function SangerPcrReactionStep({
  pcrBatchId,
  pcrBatch,
  editMode,
  setEditMode,
  performSave,
  setPerformSave
}: SangerPcrReactionProps) {
  const { apiClient, bulkGet } = useApiClient();

  const [loading, setLoading] = useState<boolean>(false);
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
  }, []);

  useEffect(() => {
    // fetchMaterialSamples();
    fetchPcrBatchItems();
  }, [selectedResources]);

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
        const pcrBatchItems: PersistedResource<PcrBatchItem>[] =
          response.data?.filter(
            (item) => item?.materialSample?.id !== undefined
          );

        setSelectedResources(pcrBatchItems);
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

  const PCR_REACTION_COLUMN: (inEditMode: boolean) => Column<PcrBatchItem>[] = (
    inEditMode
  ) => [
    {
      Cell: ({ original }) => {
        if (!original?.wellRow || !original?.wellColumn) return <></>;

        return <>{original.wellRow + "" + original.wellColumn}</>;
      },
      Header: <FieldHeader name={"wellCoordinates"} />,
      sortable: false
    },
    {
      Cell: ({ original }) => {
        if (!original?.cellNumber) return <></>;

        return <>{original.cellNumber}</>;
      },
      Header: <FieldHeader name={"tubeNumber"} />,
      sortable: false
    },
    {
      Cell: ({ original }) => (
        // <a
        //   href={`/seqdb/pcr-batch-item/view?id=${original?.materialSample?.id}`}
        // >
        //   {original?.materialSampleName ||
        //     original?.attributes?.dwcOtherCatalogNumbers?.join?.(", ") ||
        //     original?.materialSample?.id}
        // </a>
        <></>
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
      Cell: ({ original }) => {
        return inEditMode ? (
          <>edit mode</>
        ) : (
          <>{original?.result ?? "No Band"}</>
        );
      },
      Header: <FieldHeader name={"result"} />,
      sortable: false
    }
  ];

  async function onSavedInternal(resource) {
    setPerformSave(true);
    setEditMode(false);
  }

  // Wait until the PcrBatchItems have been loaded in before displaying the table.
  if (loading) {
    return <LoadingSpinner loading={true} />;
  }

  return (
    <DinaForm<Partial<PcrBatchItem>>
      initialValues={{}}
      onSubmit={onSavedInternal}
    >
      <ReactTable<PcrBatchItem>
        columns={PCR_REACTION_COLUMN(editMode)}
        defaultSorted={[{ id: "date", desc: true }]}
        data={selectedResources}
        minRows={1}
        showPagination={false}
        sortable={false}
      />
    </DinaForm>
  );
}
