import {
  ButtonBar,
  filterBy,
  QueryPage,
  useAccount,
  useApiClient,
  LoadingSpinner,
  CommonMessage,
  FieldHeader,
  Operation
} from "common-ui";
import { PersistedResource } from "kitsu";
import { MaterialSample } from "packages/dina-ui/types/collection-api";
import { useState, useEffect } from "react";
import { SeqdbMessage } from "../../../intl/seqdb-intl";
import { PcrBatchItem, PcrBatch } from "../../../types/seqdb-api";
import { TableColumn } from "packages/common-ui/lib/list-page/types";
import { pick, compact, uniq } from "lodash";
import { useIntl } from "react-intl";
import ReactTable, { Column } from "react-table";

export interface SangerSampleSelectionStepProps {
  pcrBatchId: string;
}

export function SangerSampleSelectionStep({
  pcrBatchId
}: SangerSampleSelectionStepProps) {
  const { apiClient, bulkGet, doOperations } = useApiClient();
  const { formatMessage } = useIntl();
  const { username } = useAccount();

  // State to keep track if in edit mode.
  const [editMode, setEditMode] = useState(false);

  // Keep track of the previously selected resources to compare.
  const [previouslySelectedResources, setPreviouslySelectedResources] =
    useState<PcrBatchItem[]>([]);

  // The selected resources to be used for the QueryPage.
  const [selectedResources, setSelectedResources] = useState<
    MaterialSample[] | undefined
  >(undefined);

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
        })("")
      })
      .then((response) => {
        const pcrBatchItems: PersistedResource<PcrBatchItem>[] =
          response?.data?.filter(
            (item) => item?.materialSample?.id !== undefined
          );
        const materialSampleIds: string[] =
          pcrBatchItems.map((item) => item?.materialSample?.id as string) ?? [];

        setPreviouslySelectedResources(pcrBatchItems);
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
    await bulkGet<MaterialSample>(
      sampleIds.map((id) => "/material-sample/" + id),
      { apiBaseUrl: "/collection-api" }
    ).then((response) => {
      setSelectedResources(compact(response) ?? []);
    });
  }

  /**
   * When the page is first loaded, check if saved samples has already been chosen and reload them.
   */
  useEffect(() => {
    fetchSampledIds();
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
          {sample?.materialSampleName ||
            sample?.dwcOtherCatalogNumbers?.join?.(", ") ||
            sample.id}
        </a>
      ),
      Header: <FieldHeader name={"materialSampleName"} />,
      sortable: false
    }
  ];

  async function savePcrBatchItems() {
    const { data: pcrBatch } = await apiClient.get<PcrBatch>(
      `seqdb-api/pcr-batch/${pcrBatchId}`,
      {}
    );

    // Convert to UUID arrays to compare the two arrays.
    const selectedResourceUUIDs = compact(
      selectedResources?.map((material) => material.id)
    );
    const previouslySelectedResourcesUUIDs = compact(
      previouslySelectedResources?.map((item) => ({
        materialSampleUUID: item?.materialSample?.id,
        pcrBatchItemUUID: item?.id
      }))
    );

    // UUIDs of PCR Batch Items that need to be created.
    const itemsToCreate = uniq(
      selectedResourceUUIDs.filter(
        (uuid) =>
          !previouslySelectedResourcesUUIDs.some(
            (item) => item.materialSampleUUID === uuid
          )
      )
    );

    // UUIDs of PCR Batch Items that need to be deleted.
    const itemsToDelete = uniq(
      previouslySelectedResourcesUUIDs.filter(
        (uuid) =>
          !selectedResourceUUIDs.includes(uuid.materialSampleUUID as string)
      )
    );

    // Create the operation to perform all the required API calls.
    await doOperations(
      [
        // Create operations
        ...itemsToCreate.map<Operation>((materialUUID) => ({
          op: "POST",
          path: "pcr-batch-item",
          value: {
            attributes: {
              pcrBatch: pick(pcrBatch, "id", "type"),
              group: pcrBatch.group ?? "",
              createdBy: username ?? ""
            },
            relationships: {
              materialSample: {
                data: {
                  id: materialUUID,
                  type: "material-sample"
                }
              }
            },
            type: "pcr-batch-item"
          }
        })),

        // Delete operations
        ...itemsToDelete.map<Operation>((uuid) => ({
          op: "DELETE",
          path: `pcr-batch-item/${uuid.pcrBatchItemUUID}`
        }))
      ],
      { apiBaseUrl: "seqdb-api" }
    );

    // Clear the previously selected resources.
    setPreviouslySelectedResources([]);
  }

  // Wait until selected resources are loaded.
  if (selectedResources === undefined) {
    return <LoadingSpinner loading={true} />;
  }

  const buttonBar = (
    <ButtonBar>
      <button
        className="btn btn-primary"
        type="button"
        onClick={() => {
          setEditMode(false);
          savePcrBatchItems();
        }}
        style={{ width: "10rem" }}
      >
        <SeqdbMessage id="done" />
      </button>
    </ButtonBar>
  );

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
