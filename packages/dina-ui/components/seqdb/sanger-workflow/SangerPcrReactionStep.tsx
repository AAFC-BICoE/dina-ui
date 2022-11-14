import { PersistedResource } from "kitsu";
import { PcrBatchForm } from "../../../pages/seqdb/pcr-batch/edit";
import { PcrBatch, PcrBatchItem } from "../../../types/seqdb-api";
import { useState, useEffect } from "react";
import { SubmitButton, ColumnDefinition, FieldHeader } from "common-ui";
import Link from "next/link";
import ReactTable, { Column } from "react-table";
import { TableColumn } from "common-ui/lib/list-page/types";

export interface SangerPcrReactionProps {
  pcrBatchId?: string;
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
  // If no PCR Batch has been created, automatically go to edit mode.
  useEffect(() => {
    if (!pcrBatchId) {
      setEditMode(true);
    }
  }, [pcrBatchId]);

  const [SelectedResources, setSelectedResources] = useState<PcrBatchItem[]>(
    []
  );

  const PCR_REACTION_COLUMN: Column<PcrBatchItem>[] = [
    {
      Cell: ({ original: { id, data } }) => (
        <a href={`/seqdb/pcr-batch-item/view?id=${id}`}>
          {data?.attributes?.column + data?.attributes?.row}
        </a>
      ),

      Header: <FieldHeader name={"wellCoordinates"} />,
      sortable: false
    },
    {
      Cell: ({ original: { id, data } }) => (
        <a href={`/collection/material-sample/view?id=${id}`}>
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
        <a href={`/collection/material-sample/view?id=${id}`}>
          {data?.attributes?.materialSampleName ||
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
    <ReactTable
      columns={PCR_REACTION_COLUMN}
      defaultSorted={[{ id: "date", desc: true }]}
      data={SelectedResources}
      minRows={1}
      showPagination={false}
      sortable={false}
    />
  );
}
