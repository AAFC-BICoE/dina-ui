import {
  ButtonBar,
  filterBy,
  QueryPage,
  useAccount,
  useApiClient,
  LoadingSpinner,
  CommonMessage,
  FieldHeader
} from "common-ui";
import { InputResource } from "kitsu";
import { MaterialSample } from "packages/dina-ui/types/collection-api";
import { useState, useEffect } from "react";
import { SeqdbMessage } from "../../../intl/seqdb-intl";
import { PcrBatchItem, PcrBatch } from "../../../types/seqdb-api";
import { TableColumn } from "packages/common-ui/lib/list-page/types";
import { pick, compact } from "lodash";
import { useIntl } from "react-intl";
import ReactTable, { Column } from "react-table";

export interface SangerSampleSelectionStepProps {
  pcrBatchId: string;
}

export function SangerSampleSelectionStep({
  pcrBatchId
}: SangerSampleSelectionStepProps) {
  const { apiClient, save, bulkGet } = useApiClient();
  const { formatMessage } = useIntl();
  const { username } = useAccount();

  // State to keep track if in edit mode.
  const [editMode, setEditMode] = useState(false);

  // The selected resources to be used for the QueryPage.
  const [selectedResources, setSelectedResources] = useState<
    MaterialSample[] | undefined
  >(undefined);

  // These items were originally selected but were removed.
  const [deSelectedResources, setDeselectedResources] = useState<
    MaterialSample[]
  >([]);

  /**
   * Retrieve all of the PCR Batch Items that are associated with the PCR Batch from step 1.
   */
  async function fetchSampledIds() {
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
        const materialSampleIds: string[] =
          response?.data
            ?.filter((item) => item?.materialSample?.id !== undefined)
            ?.map((item) => item?.materialSample?.id as string) ?? [];
        fetchSamples(materialSampleIds);
      });
  }

  /**
   * Taking all of the material sample UUIDs, retrieve the material samples using a bulk get
   * operation.
   *
   * @param sampleIds array of UUIDs.
   */
  async function fetchSamples(sampleIds: string[]) {
    await bulkGet<MaterialSample, true>(
      sampleIds.map((id) => "/material-sample/" + id),
      { apiBaseUrl: "/collection-api", returnNullForMissingResource: true }
    ).then((response) => {
      // console.log(JSON.stringify(compact(response)))
      setSelectedResources(compact(response) ?? []);
    });
  }

  /**
   * When the page is first loaded, check if saved samples has already been chosen and reload them.
   */
  useEffect(() => {
    fetchSampledIds();
    setDeselectedResources([]);
  }, [editMode]);

  // Displayed on edit mode only.
  const ELASTIC_SEARCH_COLUMN: TableColumn<MaterialSample>[] = [
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

  const API_SEARCH_COLUMN: Column<MaterialSample>[] = [
    {
      Cell: ({ original: sample }) => (
        <a href={`/collection/material-sample/view?id=${sample.id}`}>
          {sample.materialSampleName ||
            sample?.dwcOtherCatalogNumbers?.join?.(", ") ||
            sample.id}
        </a>
      ),
      Header: <FieldHeader name={"materialSampleName"} />,
      sortable: false
    }
  ];

  const buttonBar = (
    <ButtonBar>
      <button
        className="btn btn-primary"
        type="button"
        onClick={() => {
          setEditMode(false);
          savePcrBatchItems(selectedResources ?? []);
        }}
        style={{ width: "10rem" }}
      >
        <SeqdbMessage id="done" />
      </button>
    </ButtonBar>
  );

  async function savePcrBatchItems(samples: MaterialSample[]) {
    const { data: pcrBatch } = await apiClient.get<PcrBatch>(
      `seqdb-api/pcr-batch/${pcrBatchId}`,
      {}
    );

    const newPcrBatchItems = samples.map<InputResource<PcrBatchItem>>(
      (sample) => ({
        pcrBatch: pick(pcrBatch, "id", "type"),
        group: pcrBatch.group,
        createdBy: username,
        type: "pcr-batch-item",
        relationships: {
          materialSample: {
            data: {
              id: sample.id,
              type: sample.type
            }
          }
        }
      })
    );

    await save(
      newPcrBatchItems.map((item) => ({
        resource: item,
        type: "pcr-batch-item"
      })),
      { apiBaseUrl: "/seqdb-api" }
    );
  }

  // Wait until selected resources are loaded.
  if (selectedResources === undefined) {
    return <LoadingSpinner loading={true} />;
  }

  return editMode ? (
    <>
      {buttonBar}
      <div className="mb-3">
        <QueryPage<MaterialSample>
          indexName={"dina_material_sample_index"}
          columns={ELASTIC_SEARCH_COLUMN}
          selectionMode={true}
          selectionResourceColumns={API_SEARCH_COLUMN}
          selectionResources={selectedResources}
          setSelectionResources={setSelectedResources}
        />
      </div>
      {buttonBar}
    </>
  ) : (
    <>
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
      <ReactTable<MaterialSample>
        columns={API_SEARCH_COLUMN}
        data={selectedResources}
        minRows={1}
        defaultPageSize={100}
        pageText={<CommonMessage id="page" />}
        noDataText={<CommonMessage id="noRowsFound" />}
        ofText={<CommonMessage id="of" />}
        rowsText={formatMessage({ id: "rows" })}
        previousText={<CommonMessage id="previous" />}
        nextText={<CommonMessage id="next" />}
      />
    </>
  );
}
