import {
  ButtonBar,
  filterBy,
  MetaWithTotal,
  useQuery,
  withResponse,
  QueryPage,
  ColumnDefinition,
  QueryTable,
  useAccount,
  useApiClient
} from "common-ui";
import { InputResource, KitsuResponse } from "kitsu";
import { MaterialSample } from "packages/dina-ui/types/collection-api";
import { useState } from "react";
import { SeqdbMessage } from "../../../intl/seqdb-intl";
import { PcrBatchItem, PcrBatch } from "../../../types/seqdb-api";
import { TableColumn } from "packages/common-ui/lib/list-page/types";
import { pick } from "lodash";
import Link from "next/link";

export interface SangerSampleSelectionStepProps {
  pcrBatchId: string;
}

export function SangerSampleSelectionStep({
  pcrBatchId
}: SangerSampleSelectionStepProps) {
  const pcrBatchItemQuery = usePcrBatchItemQuery(
    pcrBatchId,
    // Default to edit mode when there are no items selected:
    async ({ meta: { totalResourceCount } }) => setEditMode(!totalResourceCount)
  );

  // State to keep track if in edit mode.
  const [editMode, setEditMode] = useState(false);

  // The selected resources to be used for the QueryPage.
  const [selectedResources, setSelectedResources] = useState<MaterialSample[]>(
    []
  );

  const { apiClient, save } = useApiClient();
  const { username } = useAccount();
  
  // Displayed on edit mode only.
  const columns: TableColumn<MaterialSample>[] = editMode
    ? [
        {
          Cell: ({ original: { id, data } }) => (
            <a href={`/collection/material-sample/view?id=${id}`}>
              {data?.attributes?.materialSampleName ||
                data?.attributes?.dwcOtherCatalogNumbers?.join?.(", ") ||
                id}
            </a>
          ),
          label: "materialSampleName",
          accessor: "data.attributes.materialSampleName",
          isKeyword: true
        }
      ]
    : [];

  // Displayed on read only mode.
  const PCRBATCH_ITEM_COLUMNS: ColumnDefinition<PcrBatchItem>[] = !editMode
    ? [
        {
          Cell: ({ original: pcrBatchItem }) => (
            <Link
              href={`/collection/material-sample/view?id=${pcrBatchItem?.materialSample?.id}`}
            >
              {pcrBatchItem?.materialSample?.id}
            </Link>
          ),
          accessor: "pcrBatchItem.materialSample.id",
          sortable: false
        }
      ]
    : [];

  const selectedItemsTable = (
    <div>
      <ButtonBar>
        <button
          className="btn btn-primary edit-button"
          type="button"
          onClick={() => setEditMode(true)}
          style={{ width: "10rem" }}
        >
          <SeqdbMessage id="editButtonText" />
        </button>
      </ButtonBar>
      <strong>
        <SeqdbMessage id="selectedSamplesTitle" />
      </strong>
      <QueryTable
        columns={PCRBATCH_ITEM_COLUMNS}
        defaultPageSize={100}
        filter={filterBy([], {
          extraFilters: [
            {
              selector: "pcrBatch.uuid",
              comparison: "==",
              arguments: pcrBatchId
            }
          ]
        })("")}
        reactTableProps={{ sortable: false }}
        path="seqdb-api/pcr-batch-item"
        include="materialSample"
      />
    </div>
  );

  const buttonBar = (
    <ButtonBar>
      <button
        className="btn btn-primary"
        type="button"
        onClick={() => {setEditMode(false); savePcrBatchItems(selectedResources)}}
        style={{ width: "10rem" }}
      >
        <SeqdbMessage id="done" />
      </button>
    </ButtonBar>
  );

  async function savePcrBatchItems(samples: MaterialSample[]){

    const { data: pcrBatch } = await apiClient.get<PcrBatch>(
      `seqdb-api/pcr-batch/${pcrBatchId}`,
      {}
    );

    const newPcrBatchItems = samples.map<InputResource<PcrBatchItem>>(
      sample => ({
        pcrBatch: pick(pcrBatch, "id", "type"),
        group: pcrBatch.group,
        createdBy: username,
        type: "pcr-batch-item",
        relationships: {
          materialSample: {
            data: {            
              id:sample.id,
              type:sample.type}
          }},
      })
    );

    await save(
      newPcrBatchItems.map(item => ({
        resource: item,
        type: "pcr-batch-item"
      })),
      { apiBaseUrl: "/seqdb-api" }
    );
  }
  

  return editMode ? (
    <div>
      {buttonBar}
      <div className="mb-3">
        <QueryPage
          indexName={"dina_material_sample_index"}
          columns={columns}
          selectionMode={true}
          selectionResources={selectedResources}
          setSelectionResources={setSelectedResources}
        />
      </div>
      {buttonBar}
    </div>
  ) : (
    withResponse(pcrBatchItemQuery, () => selectedItemsTable)
  );
}

export function usePcrBatchItemQuery(
  pcrBatchId: string,
  onSuccess:
    | ((response: KitsuResponse<PcrBatchItem, MetaWithTotal>) => void)
    | undefined
) {
  return useQuery<PcrBatchItem, MetaWithTotal>(
    {
      path: "seqdb-api/pcr-batch-item",
      filter: filterBy([], {
        extraFilters: [
          {
            selector: "pcrBatch.uuid",
            comparison: "==",
            arguments: pcrBatchId
          }
        ]
      })("")
    },
    { onSuccess }
  );
}
