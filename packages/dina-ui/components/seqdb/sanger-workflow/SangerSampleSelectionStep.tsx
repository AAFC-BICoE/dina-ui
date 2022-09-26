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
import { PersistedResource } from "kitsu";
import { MaterialSample } from "packages/dina-ui/types/collection-api";
import { useState, useEffect } from "react";
import { SeqdbMessage } from "../../../intl/seqdb-intl";
import { PcrBatchItem, PcrBatch } from "../../../types/seqdb-api";
import { TableColumn } from "packages/common-ui/lib/list-page/types";
import { pick, compact, uniq } from "lodash";
import ReactTable, { Column } from "react-table";
import { useDinaIntl } from "packages/dina-ui/intl/dina-ui-intl";

export interface SangerSampleSelectionStepProps {
  pcrBatchId: string;
}

export function SangerSampleSelectionStep({
  pcrBatchId
}: SangerSampleSelectionStepProps) {
  const { apiClient, bulkGet, save } = useApiClient();
  const { formatMessage } = useDinaIntl();
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
        })(""),
        include: "materialSample"
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
      const materialSamplesTransformed = compact(response).map((resource) => ({
        data: {
          attributes: pick(resource, ["materialSampleName"])
        },
        id: resource.id,
        type: resource.type
      }));

      // If there is nothing stored yet, automatically go to edit mode.
      if (materialSamplesTransformed.length === 0) {
        setEditMode(true);
      }

      setSelectedResources(materialSamplesTransformed ?? []);
    });
  }

  /**
   * When the page is first loaded, check if saved samples has already been chosen and reload them.
   */
  useEffect(() => {
    if (editMode || !selectedResources) {
      fetchSampledIds();
    }
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

    // Perform create
    if (itemsToCreate.length !== 0) {
      await save(
        itemsToCreate.map((materialUUID) => ({
          resource: {
            type: "pcr-batch-item",
            group: pcrBatch.group ?? "",
            createdBy: username ?? "",
            pcrBatch: pick(pcrBatch, "id", "type"),
            relationships: {
              materialSample: {
                data: {
                  id: materialUUID,
                  type: "material-sample"
                }
              }
            }
          },
          type: "pcr-batch-item"
        })),
        { apiBaseUrl: "/seqdb-api" }
      );
    }

    // Perform deletes
    if (itemsToDelete.length !== 0) {
      await save(
        itemsToDelete.map((item) => ({
          delete: {
            id: item.pcrBatchItemUUID ?? "",
            type: "pcr-batch-item"
          }
        })),
        { apiBaseUrl: "/seqdb-api" }
      );
    }

    // Clear the previously selected resources.
    setPreviouslySelectedResources([]);
    setEditMode(false);
  }

  // Wait until selected resources are loaded.
  if (selectedResources === undefined) {
    return <LoadingSpinner loading={true} />;
  }

  const buttonBar = (
    <ButtonBar>
      <div className="ms-auto">
        <button
          className="btn btn-primary"
          type="button"
          onClick={() => {
            savePcrBatchItems();
          }}
          style={{ width: "10rem" }}
          disabled={selectedResources.length === 0}
        >
          {formatMessage("save")}
        </button>
      </div>
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
        rowsText={formatMessage("rows")}
        previousText={<CommonMessage id="previous" />}
        nextText={<CommonMessage id="next" />}
      />
    </>
  );
}
