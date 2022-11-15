import { PersistedResource } from "kitsu";
import { PcrBatchForm } from "../../../pages/seqdb/pcr-batch/edit";
import { PcrBatch, PcrBatchItem } from "../../../types/seqdb-api";
import { useState, useEffect } from "react";
import { SubmitButton, filterBy, FieldHeader, useApiClient } from "common-ui";
import Link from "next/link";
import ReactTable, { Column } from "react-table";
import { MaterialSample, Determination } from "../../../types/collection-api";

interface PcrBatchItemReactionStep {
  pcrBatchItem: PcrBatchItem;
  materialSample?: MaterialSample;
  determination?: Determination;
}

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

  const [selectedResources, setSelectedResources] = useState<
    PcrBatchItemReactionStep[]
  >([]);

  useEffect(() => {
    fetchPcrBatchItems();
  }, []);

  useEffect(() => {
    fetchMaterialSamples();
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
          response?.data?.filter(
            (item) => item?.materialSample?.id !== undefined
          );

        setSelectedResources(
          pcrBatchItems.map((pcrBatchItem) => {
            return { pcrBatchItem };
          })
        );
      });
  }

  async function fetchMaterialSamples() {
    await bulkGet<MaterialSample>(
      selectedResources.map(
        (item) => "/material-sample/" + item.pcrBatchItem?.materialSample?.id
      ),
      { apiBaseUrl: "/collection-api" }
    ).then((response) => {
      // const materialSamplesTransformed = compact(response).map((resource) => ({
      //   data: {
      //     attributes: pick(resource, ["materialSampleName"])
      //   },
      //   id: resource.id,
      //   type: resource.type
      // }));
      // console.log(JSON.stringify(response));
      // setSelectedResources(materialSamplesTransformed ?? []);
    });
  }

  const PCR_REACTION_COLUMN: Column<PcrBatchItemReactionStep>[] = [
    {
      Cell: ({ original: { id, data } }) => (
        <a href={`/seqdb/pcr-batch-item/view?id=${id}`}>
          {data.attributes?.wellRow + data?.attributes?.wellColumn}
        </a>
      ),

      Header: <FieldHeader name={"wellCoordinates"} />,
      sortable: false
    },
    {
      Cell: ({ original: { id, data } }) => (
        <a href={`/seqdb/pcr-batch-item/view?id=${id}`}>
          {data?.attributes?.materialSampleName ||
            data?.attributes?.dwcOtherCatalogNumbers?.join?.(", ") ||
            id}
        </a>
      ),
      Header: <FieldHeader name={"tubeNumber"} />,
      sortable: false
    },
    {
      Cell: ({ original: { id, data } }) => (
        <a href={`/seqdb/pcr-batch-item/view?id=${id}`}>
          {data?.attributes?.materialSample.materialSampleName ||
            data?.attributes?.dwcOtherCatalogNumbers?.join?.(", ") ||
            id}
        </a>
      ),
      Header: <FieldHeader name={"materialSampleName"} />,
      sortable: false
    },
    {
      Cell: ({ original: { id, data } }) => (
        <a href={`/collection/material-sample/view?id=${id}`}>
          {data?.attributes?.organism}
        </a>
      ),
      Header: <FieldHeader name={"scientificName"} />,
      sortable: false
    },
    {
      Cell: ({ original: { id, data } }) => (
        <a href={`/seqdb/pcr-batch-item/view?id=${id}`}>
          {data?.attributes?.result}
        </a>
      ),
      Header: <FieldHeader name={"result"} />,
      sortable: false
    }
  ];

  async function onSavedInternal(resource: PersistedResource<PcrBatch>) {
    setEditMode(false);
  }

  const buttonBar = (
    <>
      <SubmitButton
        className="hidden"
        performSave={performSave}
        setPerformSave={setPerformSave}
      />
    </>
  );

  return (
    <ReactTable<PcrBatchItemReactionStep>
      columns={PCR_REACTION_COLUMN}
      defaultSorted={[{ id: "date", desc: true }]}
      data={selectedResources}
      minRows={1}
      showPagination={false}
      sortable={false}
    />
  );
}
