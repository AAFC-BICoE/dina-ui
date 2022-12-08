import {
  filterBy,
  QueryPage2,
  useAccount,
  useApiClient,
  LoadingSpinner,
  CommonMessage,
  FieldHeader,
  TextField,
  DinaForm,
  useDinaFormContext
} from "common-ui";
import { PersistedResource } from "kitsu";
import { MaterialSample } from "packages/dina-ui/types/collection-api";
import { useState, useEffect } from "react";
import { SeqdbMessage } from "../../../intl/seqdb-intl";
import { SeqBatch, PcrBatchItem, PcrBatch } from "../../../types/seqdb-api";
import { TableColumn } from "common-ui/lib/list-page/types";
import { pick, compact, uniq } from "lodash";
import ReactTable, { Column } from "react-table";
import { useDinaIntl } from "packages/dina-ui/intl/dina-ui-intl";

export interface SangerPcrBatchSelectionStepProps {
  seqBatchId: string;
  seqBatch?: SeqBatch;
  editMode: boolean;
  setEditMode: (newValue: boolean) => void;
  performSave: boolean;
  setPerformSave: (newValue: boolean) => void;
}

export function SangerPcrBatchSelectionStep({
  seqBatchId,
  seqBatch,
  editMode,
  setEditMode,
  performSave,
  setPerformSave
}: SangerPcrBatchSelectionStepProps) {
  const { apiClient, bulkGet, save } = useApiClient();
  const { formatMessage } = useDinaIntl();
  const { username } = useAccount();

  const API_SEARCH_COLUMN: Column<PcrBatch>[] = [
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
    }
  ];

  // Check if a save was requested from the top level button bar.
  useEffect(() => {
    async function performSaveInternal() {
      await saveSeqBatchItems();
      setPerformSave(false);
    }

    if (performSave) {
      performSaveInternal();
    }
  }, [performSave]);

  // Keep track of the previously selected resources to compare.
  const [previouslySelectedResources, setPreviouslySelectedResources] =
    useState<PcrBatchItem[]>([]);

  async function saveSeqBatchItems() {
    // const seqBatchQueryState = await apiClient.get<SeqBatch>(
    //   `seqdb-api/seq-batch/${seqBatchId}`,
    //   {}
    // );

    // // Convert to UUID arrays to compare the two arrays.
    // const selectedResourceUUIDs = compact(
    //   selectedResources?.map((material) => material.id)
    // );
    // const previouslySelectedResourcesUUIDs = compact(
    //   previouslySelectedResources?.map((item) => ({
    //     materialSampleUUID: item?.materialSample?.id,
    //     seqBatchItemUUID: item?.id
    //   }))
    // );

    // // UUIDs of PCR Batch Items that need to be created.
    // const itemsToCreate = uniq(
    //   selectedResourceUUIDs.filter(
    //     (uuid) =>
    //       !previouslySelectedResourcesUUIDs.some(
    //         (item) => item.materialSampleUUID === uuid
    //       )
    //   )
    // );

    // // UUIDs of PCR Batch Items that need to be deleted.
    // const itemsToDelete = uniq(
    //   previouslySelectedResourcesUUIDs.filter(
    //     (uuid) =>
    //       !selectedResourceUUIDs.includes(uuid.materialSampleUUID as string)
    //   )
    // );

    // // Perform create
    // if (itemsToCreate.length !== 0) {
    //   await save(
    //     itemsToCreate.map((materialUUID) => ({
    //       resource: {
    //         type: "seq-batch-item",
    //         group: seqBatchQueryState.data?.group ?? "",
    //         createdBy: username ?? "",
    //         seqBatch: pick(seqBatch, "id", "type"),
    //         relationships: {
    //           materialSample: {
    //             data: {
    //               id: materialUUID,
    //               type: "material-sample"
    //             }
    //           }
    //         }
    //       },
    //       type: "seq-batch-item"
    //     })),
    //     { apiBaseUrl: "/seqdb-api" }
    //   );
    // }

    // // Perform deletes
    // if (itemsToDelete.length !== 0) {
    //   await save(
    //     itemsToDelete.map((item) => ({
    //       delete: {
    //         id: item.seqBatchItemUUID ?? "",
    //         type: "seq-batch-item"
    //       }
    //     })),
    //     { apiBaseUrl: "/seqdb-api" }
    //   );
    // }

    // Clear the previously selected resources.
    setPreviouslySelectedResources([]);
    setEditMode(false);
  }

  const onSubmit = () => {
    // TODO: implement it later.
  };

  return editMode ? (
    <div className="row">
      <QueryPage2<PcrBatch>
        columns={API_SEARCH_COLUMN}
        selectionMode={true}
        indexName={""}
      />
    </div>
  ) : (
    <>
      <strong>
        <SeqdbMessage id="selectPcrBatchTitle" />
      </strong>
      {/* <ReactTable<MaterialSample>
        columns={API_SEARCH_COLUMN}
        data={selectedResources}
        minRows={1}
        defaultPageSize={100}
        pageText={<CommonMessage id="page" />}
        noDataText={<CommonMessage id="noRowsFound" />}
        ofText={<CommonMessage id="of" />}
        rowsText={formatMessage("rows")}
        previousText={<CommonMessage id="previous" />}
        nextText={<CommonMessage id="next" />}
      /> */}
    </>
  );
}
