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
  useIsMounted,
  useQuery
} from "common-ui";
import { FormikContextType } from "formik";
import { PersistedResource } from "kitsu";
import { compact, pick, toPairs, uniqBy } from "lodash";
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

export interface SangerSeqReactionStepProps {
  seqBatch?: SeqBatch;
  editMode: boolean;
  performSave: boolean;
  setPerformSave: (newValue: boolean) => void;
  onSaved: (
    nextStep: number,
    pcrBatchSaved?: PersistedResource<SeqBatch>
  ) => Promise<void>;
}

export function SangerSeqReactionStep({
  seqBatch,
  editMode,
  performSave,
  setPerformSave,
  onSaved
}: SangerSeqReactionStepProps) {
  const { apiClient, save } = useApiClient();
  const { formatMessage } = useDinaIntl();
  const { isAdmin, groupNames, username } = useAccount();
  const [searchResult, setSearchResults] = useState<PcrBatchItem[]>([]);
  const [selectedPcrPrimer, setSelectedPcrPrimer] = useState<PcrPrimer>();
  const [group, setGroup] = useState(
    groupNames && groupNames.length > 0 ? groupNames[0] : ""
  );
  const [selectedPcrBatch, setSelectedPcrBatch] = useState<PcrBatch>();
  const [selectedRegion, setSelectedRegion] = useState<Region>();
  const [selectedResources, setSelectedResources] = useState<SeqReaction[]>([]);
  const isMounted = useIsMounted();

  // The map key is pcrBatchItem.id + "_" + seqPrimer.id
  // the map value is the real UUID from the database.
  const [
    previouslySelectedResourcesIDMap,
    setPreviouslySelectedResourcesIDMap
  ] = useState<{ [key: string]: string }>({} as { [key: string]: string });

  const defaultValues = {
    group: groupNames && groupNames.length > 0 ? groupNames[0] : undefined,
    seqBatchName: seqBatch?.name
  };

  // Check if a save was requested from the top level button bar.
  useEffect(() => {
    async function performSaveInternal() {
      await saveSeqReactions();
      setPerformSave(false);
      await onSaved(2);
    }

    if (performSave) {
      performSaveInternal();
    }
  }, [performSave]);

  async function saveSeqReactions() {
    // The map key is pcrBatchItem.id + "_" + seqPrimer.id
    // The map value is a instance of SeqReaction
    const selectedResourceMap = compact(selectedResources).reduce(
      (accu, obj) => ({
        ...accu,
        [`${obj.pcrBatchItem?.id}_${obj.seqPrimer?.id}`]: obj
      }),
      {} as { [key: string]: SeqReaction }
    );

    const itemsToCreate: SeqReaction[] = Object.keys(selectedResourceMap)
      .filter((key) => !previouslySelectedResourcesIDMap[key])
      .map((key) => selectedResourceMap[key]);

    const itemIdsToDelete: string[] = compact(
      Object.keys(previouslySelectedResourcesIDMap)
        .filter((key) => !selectedResourceMap[key])
        .map((key) => previouslySelectedResourcesIDMap[key])
    );

    // Perform create
    if (itemsToCreate.length !== 0) {
      await save(
        itemsToCreate.map((data) => ({
          resource: {
            type: "seq-reaction",
            group: data.group ?? "",
            createdBy: username ?? "",
            relationships: {
              seqBatch: {
                data: pick(data.seqBatch, "id", "type")
              },
              pcrBatchItem: {
                data: pick(data.pcrBatchItem, "id", "type")
              },
              seqPrimer: {
                data: {
                  type: "pcr-primer",
                  id: data.seqPrimer?.id ?? ""
                }
              }
            }
          },
          type: "seq-reaction"
        })),
        { apiBaseUrl: "/seqdb-api" }
      );
    }

    // Perform deletes
    if (itemIdsToDelete.length !== 0) {
      await save(
        itemIdsToDelete.map((id) => ({
          delete: {
            id: id ?? "",
            type: "seq-reaction"
          }
        })),
        { apiBaseUrl: "/seqdb-api" }
      );
    }
    // Clear the previously selected resources.
    setPreviouslySelectedResourcesIDMap({});
  }

  /**
   * When the page is first loaded, check if saved samples has already been chosen and reload them.
   */
  useEffect(() => {
    if (editMode || !selectedResources || selectedResources.length === 0) {
      fetchSeqReactions();
    }
  }, [editMode]);

  const fetchSeqReactions = async () => {
    const { data: seqReactions } = await apiClient.get<SeqReaction[]>(
      "/seqdb-api/seq-reaction",
      {
        filter: {
          "seqBatch.uuid": seqBatch?.id as string
        },
        include: ["pcrBatchItem", "seqPrimer"].join(",")
      }
    );

    for (const item of seqReactions) {
      if (!!item.pcrBatchItem?.id) {
        const { data: pcrBatchItem } = await apiClient.get<PcrBatchItem>(
          `/seqdb-api/pcr-batch-item/${item.pcrBatchItem.id}`,
          {
            include: "materialSample"
          }
        );
        item.pcrBatchItem = pcrBatchItem;
        if (!!pcrBatchItem?.materialSample?.id) {
          const { data: materialSample } = await apiClient.get<MaterialSample>(
            `collection-api/material-sample/${pcrBatchItem.materialSample.id}`,
            {}
          );
          if (!!materialSample) {
            (item.pcrBatchItem as PcrBatchItem).materialSample = materialSample;
          }
        }
      }
    }

    if (isMounted.current) {
      setPreviouslySelectedResourcesIDMap(
        compact(seqReactions).reduce(
          (accu, obj) => ({
            ...accu,
            [`${obj.pcrBatchItem?.id}_${obj.seqPrimer?.id}`]: obj.id
          }),
          {} as { [key: string]: string }
        )
      );

      for (const item of seqReactions) {
        const tempId: (string | undefined)[] = [];
        tempId.push(item.pcrBatchItem?.id);
        tempId.push(item.seqPrimer?.id);
        item.id = compact(tempId).join("_");
      }
      setRemovableItems(seqReactions);
      setSelectedResources(seqReactions);
    }
  };

  //#region of PCR Batch Item table
  // Checkbox for the first table that lists the search results
  const {
    CheckBoxField: SelectCheckBox,
    CheckBoxHeader: SelectCheckBoxHeader,
    setAvailableItems: setAvailableItems
  } = useGroupedCheckBoxes<PcrBatchItem>({
    fieldName: "itemIdsToSelect"
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
        setAvailableItems(data);
        setSearchResults(data);
      }
    }
  );

  const PCR_BATCH_ITEM_COLUMN: TableColumn<PcrBatchItem>[] = [
    {
      Cell: ({ original: resource }) => (
        <SelectCheckBox key={resource.id} resource={resource} />
      ),
      Header: SelectCheckBoxHeader,
      sortable: false
    },
    {
      Cell: ({ original }) =>
        original?.materialSample?.materialSampleName ||
        original?.materialSample.id ||
        "",
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
    <div className="d-flex align-items-start col-md-5">
      <ReactTable<PcrBatchItem>
        className="w-100"
        columns={PCR_BATCH_ITEM_COLUMN}
        data={pcrBatchItemQuery?.response?.data}
        minRows={1}
        showPagination={false}
        loading={pcrBatchItemQuery?.loading}
        sortable={false}
      />
    </div>
  );

  // Generate the key for the DINA form. It should only be generated once.
  const formKey = useMemo(() => uuidv4(), []);

  //#endregion of PCR Batch item table

  //#region of Gene Region and Primer

  // Checkbox for second table where selected/to be deleted items are displayed
  const {
    CheckBoxField: DeselectCheckBox,
    CheckBoxHeader: DeselectCheckBoxHeader,
    setAvailableItems: setRemovableItems
  } = useGroupedCheckBoxes({
    fieldName: "itemIdsToDelete"
  });
  const SELECTED_RESOURCE_SELECT_ALL_HEADER = editMode
    ? [
        {
          Cell: ({ original: resource }) => (
            <DeselectCheckBox
              key={`${resource.pcrBatchItem.id}_${resource.seqPrimer.id}`}
              resource={resource}
            />
          ),
          Header: DeselectCheckBoxHeader,
          sortable: false
        }
      ]
    : [];
  const SELECTED_RESOURCE_HEADER = [
    ...SELECTED_RESOURCE_SELECT_ALL_HEADER,
    {
      Cell: ({ original }) =>
        original?.pcrBatchItem?.materialSample?.materialSampleName ||
        original?.pcrBatchItem?.materialSample?.id ||
        "",
      Header: <FieldHeader name={"sampleName"} />,
      sortable: false
    },
    {
      Cell: ({ original }) => (
        <div
          style={{
            backgroundColor:
              "#" + pcrBatchItemResultColor(original?.pcrBatchItem?.result),
            borderRadius: "5px",
            paddingLeft: "5px"
          }}
        >
          {original?.pcrBatchItem?.result ?? ""}
        </div>
      ),
      Header: <FieldHeader name={"result"} />,
      sortable: false
    },
    {
      Cell: ({ original }) =>
        original?.pcrBatchItem?.wellRow === null ||
        original?.pcrBatchItem?.wellColumn === null
          ? ""
          : original.pcrBatchItem?.wellRow +
            "" +
            original.pcrBatchItem?.wellColumn,
      Header: <FieldHeader name={"wellCoordinates"} />,
      sortable: false
    },
    {
      Cell: ({ original }) => original?.pcrBatchItem?.cellNumber || "",
      Header: <FieldHeader name={"tubeNumber"} />,
      sortable: false
    },
    {
      Cell: ({ original }) => original?.seqPrimer?.name || "",
      Header: <FieldHeader name={"primer"} />,
      sortable: false
    },
    {
      Cell: ({ original }) => original?.seqPrimer?.direction || "",
      Header: <FieldHeader name={"direction"} />,
      sortable: false
    }
  ];

  //#endregion of Gene Region and Primer

  /**
   * Used for selection mode only.
   *
   * Takes all of the checked items from the search results, and moves them to the right table to
   * mark them as selected.
   *
   * @param formValues Current form values.
   * @param formik Formik Context
   */
  function addSelectedResources(formValues, formik: FormikContextType<any>) {
    const itemIdsToSelect = formValues.itemIdsToSelect;

    const ids = toPairs(itemIdsToSelect)
      .filter((pair) => pair[1])
      .map((pair) => pair[0]);

    if (!selectedPcrPrimer || ids.length === 0) {
      return;
    }

    const selectedObjects: SeqReaction[] = searchResult
      ?.filter((itemA) => {
        return ids.find((itemB) => {
          return itemA.id === itemB;
        });
      })
      .map((item) => ({
        type: "seq-reaction",
        id: `${item.id}_${selectedPcrPrimer?.id}`,
        group: item.group,
        seqBatch,
        pcrBatchItem: item,
        seqPrimer: selectedPcrPrimer
      }));

    // Append the newly selected resources with the current resources.
    const selectedResourcesAppended = uniqBy(
      [...selectedResources, ...selectedObjects],
      "id"
    );

    setSelectedResources(selectedResourcesAppended);
    setRemovableItems(selectedResourcesAppended);

    // Deselect the search results.
    formik.setFieldValue("itemIdsToSelect", {});
  }

  /**
   * Used for selection mode only.
   *
   * Removes the selected resources checked.
   *
   * @param formValues Current form values.
   * @param formik Formik Context
   */
  function removeSelectedResources(formValues, formik: FormikContextType<any>) {
    const itemIdsToDelete = formValues.itemIdsToDelete;

    const ids = toPairs(itemIdsToDelete)
      .filter((pair) => pair[1])
      .map((pair) => pair[0]);

    const unselectedObjects = selectedResources.filter((itemA) => {
      return !ids.find((id) => {
        return itemA.id === id;
      });
    });

    setRemovableItems(unselectedObjects);
    setSelectedResources(unselectedObjects);
    formik.setFieldValue("itemIdsToDelete", {});
  }

  return editMode ? (
    <DinaForm key={formKey} initialValues={defaultValues}>
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
            omitNullOption={true}
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
            omitNullOption={true}
            isDisabled={!selectedRegion}
            model="seqdb-api/pcr-primer"
            optionLabel={(primer) => `${primer.name} - ${primer.lotNumber}`}
            readOnlyLink="/seqdb/pcr-primer/view?id="
            onChange={(value) => setSelectedPcrPrimer(value as PcrPrimer)}
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
        <div className="d-flex align-items-start col-md-6">
          <ReactTable<SeqReaction>
            className="react-table-overflow w-100"
            columns={SELECTED_RESOURCE_HEADER}
            data={selectedResources}
            minRows={1}
            showPagination={false}
            sortable={false}
          />
        </div>
      </div>
    </DinaForm>
  ) : (
    <DinaForm key={formKey} initialValues={defaultValues} readOnly={true}>
      <strong>
        <SeqdbMessage id="selectPcrBatchTitle" />
      </strong>
      <div className="row">
        <ReactTable<SeqReaction>
          className="react-table-overflow col-md-12"
          columns={SELECTED_RESOURCE_HEADER}
          data={selectedResources}
          minRows={1}
          showPagination={false}
          sortable={false}
        />
      </div>
    </DinaForm>
  );
}
