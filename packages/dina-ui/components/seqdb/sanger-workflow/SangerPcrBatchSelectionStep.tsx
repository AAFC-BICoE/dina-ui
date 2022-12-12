import {
  DinaForm,
  FieldHeader,
  filterBy,
  FormikButton,
  ResourceSelectField,
  TextField,
  useAccount,
  useApiClient,
  useGroupedCheckBoxes,
  useQuery
} from "common-ui";
import { TableColumn } from "packages/common-ui/lib/list-page/types";
import { useDinaIntl } from "packages/dina-ui/intl/dina-ui-intl";
import { MaterialSample } from "packages/dina-ui/types/collection-api";
import { useEffect, useMemo, useState } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import ReactTable from "react-table";
import { v4 as uuidv4 } from "uuid";
import { SeqdbMessage } from "../../../intl/seqdb-intl";
import {
  PcrBatch,
  PcrBatchItem,
  pcrBatchItemResultColor,
  PcrPrimer,
  Region,
  SeqBatch,
  SeqReaction
} from "../../../types/seqdb-api";
import { GroupSelectField } from "../../group-select/GroupSelectField";

export interface SangerPcrBatchSelectionStepProps {
  seqBatch?: SeqBatch;
  editMode: boolean;
  setEditMode: (newValue: boolean) => void;
  performSave: boolean;
  setPerformSave: (newValue: boolean) => void;
}

export function SangerPcrBatchSelectionStep({
  seqBatch,
  editMode,
  setEditMode,
  performSave,
  setPerformSave
}: SangerPcrBatchSelectionStepProps) {
  const { apiClient, bulkGet, save } = useApiClient();
  const { formatMessage } = useDinaIntl();
  const { isAdmin, groupNames } = useAccount();

  const [group, setGroup] = useState(
    groupNames && groupNames.length > 0 ? groupNames[0] : ""
  );

  const defaultValues = {
    group: groupNames && groupNames.length > 0 ? groupNames[0] : undefined,
    seqBatchName: seqBatch?.name
  };

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

    setEditMode(false);
  }

  const onSubmit = () => {
    // TODO: implement it later.
  };
  //#region of PCR Batch Item table
  const [selectedPcrBatch, setSelectedPcrBatch] = useState<PcrBatch>();
  const [pcrBatchItems, setPcrBatchItems] = useState<PcrBatchItem[]>();

  // Checkbox for the first table that lists the search results
  const {
    CheckBoxField: SelectCheckBox,
    CheckBoxHeader: SelectCheckBoxHeader,
    setAvailableItems: setAvailableResources
  } = useGroupedCheckBoxes({
    fieldName: "itemIdsToSelect",
    defaultAvailableItems: pcrBatchItems ?? []
  });

  const pcrBatchItemQuery = useQuery<PcrBatchItem[]>(
    {
      path: `seqdb-api/pcr-batch-item`,
      include: ["pcrBatch", "materialSample"].join(","),
      filter: {
        "pcrBatch.uuid": selectedPcrBatch?.id as string
      }
    },
    {
      disabled: !selectedPcrBatch,
      onSuccess: async ({ data }) => {
        for (const item of data) {
          if (item && item.materialSample && item.materialSample.id) {
            const { data: materialSample } =
              await apiClient.get<MaterialSample>(
                `collection-api/material-sample/${item.materialSample.id}`,
                {}
              );
            (item.materialSample as MaterialSample).materialSampleName =
              materialSample?.materialSampleName;
          }
        }
      }
    }
  );

  const PCR_BATCH_ITEM_COLUMN: TableColumn<PcrBatchItem>[] = [
    {
      Cell: ({ original: resource }) => (
        <SelectCheckBox key={resource.id} resource={resource} />
      ),
      Header: SelectCheckBoxHeader,
      sortable: false,
      width: 150
    },
    {
      Cell: ({ original }) =>
        original?.materialSample?.materialSampleName || "",
      Header: <FieldHeader name={"sampleName"} />,
      sortable: false
    },
    {
      Cell: ({ original }) => (
        <div
          style={{
            backgroundColor: "#" + pcrBatchItemResultColor(original?.result),
            borderRadius: "5px",
            paddingLeft: "5px"
          }}
        >
          {original?.result ?? ""}
        </div>
      ),
      Header: <FieldHeader name={"result"} />,
      sortable: false
    },
    {
      Cell: ({ original }) =>
        original?.wellRow === null || original?.wellColumn === null
          ? ""
          : original.wellRow + "" + original.wellColumn,
      Header: <FieldHeader name={"wellCoordinates"} />,
      sortable: false
    },
    {
      Cell: ({ original }) => original?.cellNumber || "",
      Header: <FieldHeader name={"tubeNumber"} />,
      sortable: false
    }
  ];

  const pcrBatchTable = (
    <ReactTable<PcrBatchItem>
      className="col-md-5"
      columns={PCR_BATCH_ITEM_COLUMN}
      data={pcrBatchItemQuery?.response?.data}
      minRows={1}
      showPagination={false}
      loading={pcrBatchItemQuery?.loading}
      sortable={false}
    />
  );

  // Generate the key for the DINA form. It should only be generated once.
  const formKey = useMemo(() => uuidv4(), []);

  //#endregion of PCR Batch item table

  //#region of Gene Region and Primer
  const [selectedRegion, setSelectedRegion] = useState<Region>();
  const [selectedResources, setSelectedResources] = useState<any[]>();

  // Checkbox for second table where selected/to be deleted items are displayed
  const {
    CheckBoxField: DeselectCheckBox,
    CheckBoxHeader: DeselectCheckBoxHeader,
    setAvailableItems: setRemovableItems
  } = useGroupedCheckBoxes({
    fieldName: "itemIdsToDelete",
    defaultAvailableItems: selectedResources ?? []
  });

  const SELECTED_RESOURCE_HEADER = [
    {
      Cell: ({ original: resource }) => (
        <DeselectCheckBox key={resource.id} resource={resource} />
      ),
      Header: DeselectCheckBoxHeader,
      sortable: false,
      width: 150
    },
    {
      Cell: ({ original }) => original?.materialSample?.name || "",
      Header: <FieldHeader name={"sampleName"} />,
      sortable: false
    },
    {
      Cell: ({ original }) => (
        <div
          style={{
            backgroundColor: "#" + pcrBatchItemResultColor(original?.result),
            borderRadius: "5px",
            paddingLeft: "5px"
          }}
        >
          {original?.result ?? ""}
        </div>
      ),
      Header: <FieldHeader name={"result"} />,
      sortable: false
    },
    {
      Cell: ({ original }) =>
        original?.wellRow === null || original?.wellColumn === null
          ? ""
          : original.wellRow + "" + original.wellColumn,
      Header: <FieldHeader name={"wellCoordinates"} />,
      sortable: false
    },
    {
      Cell: ({ original }) => original?.cellNumber || "",
      Header: <FieldHeader name={"tubeNumber"} />,
      sortable: false
    },
    {
      Cell: ({ original }) => original?.cellNumber || "",
      Header: <FieldHeader name={"primer"} />,
      sortable: false
    },
    {
      Cell: ({ original }) => original?.cellNumber || "",
      Header: <FieldHeader name={"direction"} />,
      sortable: false
    }
  ];

  //#endregion of Gene Region and Primer

  const addSelectedResources = () => {
    // TODO: asdf
  };
  const removeSelectedResources = () => {
    // TODO: sadfas
  };

  return editMode ? (
    <DinaForm key={formKey} initialValues={defaultValues} onSubmit={onSubmit}>
      <div className="row">
        <TextField
          className="col-md-5 pe-3 mt-3"
          name="seqBatchName"
          label={formatMessage("seqBatchName")}
          readOnly={true}
        />
      </div>
      <div className="row">
        <GroupSelectField
          className="col-md-5 pe-3"
          name="group"
          enableStoredDefaultGroup={true}
          onChange={(value) => setGroup(value)}
        />
      </div>
      <div className="row">
        <ResourceSelectField<PcrBatch>
          name="pcrBatch"
          label={formatMessage("pcrBatch")}
          className="col-md-5 pe-3"
          filter={filterBy(
            ["name"],
            !isAdmin
              ? {
                  extraFilters: [
                    {
                      selector: "group",
                      comparison: "==",
                      arguments: group
                    }
                  ]
                }
              : undefined
          )}
          isDisabled={!group}
          readOnlyLink="/seqdb/pcr-batch/view?id="
          model="seqdb-api/pcr-batch"
          optionLabel={(pcrBatch) => `${pcrBatch.name || pcrBatch.id}`}
          onChange={(value) => setSelectedPcrBatch(value as PcrBatch)}
        />
      </div>
      <div className="row">
        {pcrBatchTable}
        <div className="col-md-1">
          <ResourceSelectField<Region>
            name="region"
            filter={filterBy(["name"])}
            model="seqdb-api/region"
            optionLabel={(region) => region.name}
            readOnlyLink="/seqdb/region/view?id="
            onChange={(value) => setSelectedRegion(value as Region)}
          />
          <ResourceSelectField<PcrPrimer>
            name="primer"
            filter={filterBy(
              ["name"],
              !!selectedRegion
                ? {
                    extraFilters: [
                      {
                        selector: "region.uuid",
                        comparison: "==",
                        arguments: selectedRegion?.id || ""
                      }
                    ]
                  }
                : undefined
            )}
            isDisabled={!selectedRegion}
            model="seqdb-api/pcr-primer"
            optionLabel={(primer) => `${primer.name} - ${primer.lotNumber}`}
            readOnlyLink="/seqdb/pcr-primer/view?id="
          />
          <div className="mt-3">
            <FormikButton
              className="btn btn-primary w-100 mb-3"
              onClick={addSelectedResources}
            >
              <FiChevronRight />
            </FormikButton>
          </div>
          <div className="deselect-all-checked-button">
            <FormikButton
              className="btn btn-dark w-100 mb-3"
              onClick={removeSelectedResources}
            >
              <FiChevronLeft />
            </FormikButton>
          </div>
        </div>

        <ReactTable<SeqReaction>
          className="react-table-overflow col-md-6"
          columns={SELECTED_RESOURCE_HEADER}
          minRows={1}
          showPagination={false}
          sortable={false}
        />
      </div>
    </DinaForm>
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
