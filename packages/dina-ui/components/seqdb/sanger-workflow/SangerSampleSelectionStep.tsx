import {
  ButtonBar,
  filterBy,
  MetaWithTotal,
  useQuery,
  withResponse,
  QueryPage
} from "common-ui";
import { KitsuResponse } from "kitsu";
import { MaterialSample } from "packages/dina-ui/types/collection-api";
import { useState } from "react";
import { SeqdbMessage } from "../../../intl/seqdb-intl";
import { PcrBatchItem } from "../../../types/seqdb-api";
import { TableColumn } from "packages/common-ui/lib/list-page/types";

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

  const [editMode, setEditMode] = useState(false);

  const [searchValue, setSearchValue] = useState("");

  const columns: TableColumn<MaterialSample>[] = [
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
  ];

  const buttonBar = (
    <ButtonBar>
      <button
        className="btn btn-primary"
        type="button"
        onClick={() => setEditMode(false)}
        style={{ width: "10rem" }}
      >
        <SeqdbMessage id="done" />
      </button>
    </ButtonBar>
  );

  return withResponse(pcrBatchItemQuery, () =>
    // editMode ? (
      <div>
        {buttonBar}
        <div className="alert alert-warning d-inline-block">
          <SeqdbMessage id="sampleSelectionInstructions" />
        </div>
        <div className="mb-3">
        <strong>
          <SeqdbMessage id="availableMaterialSamplesTitle" />
        </strong>
        <QueryPage
          indexName={"dina_material_sample_index"}
          columns={columns}
          selectionMode={true}
        />
        </div>
        {buttonBar}
      </div>
    ) 
    // : (
      // selectedItemsTable
    // )
  // );
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
