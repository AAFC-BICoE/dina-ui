import { useLocalStorage } from "@rehooks/local-storage";
import {
  DinaForm,
  FieldHeader,
  filterBy,
  FormikButton,
  LoadingSpinner,
  ReactTable8,
  ResourceSelectField,
  TextField,
  useAccount,
  useApiClient,
  useGroupedCheckBoxes,
  useIsMounted,
  useQuery,
  useStringComparator
} from "common-ui";
import { FormikContextType } from "formik";
import { PersistedResource } from "kitsu";
import { compact, pick, toPairs, uniqBy } from "lodash";
import { useDinaIntl } from "packages/dina-ui/intl/dina-ui-intl";
import { MaterialSample } from "packages/dina-ui/types/collection-api";
import { useEffect, useMemo, useState } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
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
import { SeqReactionDndTable } from "./seq-reaction-step/SeqReactionDndTable";
import { ColumnDef } from "@tanstack/react-table";

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
  const { apiClient, save, bulkGet } = useApiClient();
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
  const { compareByStringAndNumber } = useStringComparator();
  const [seqReactionSortOrder, setSeqReactionSortOrder] = useLocalStorage<
    string[]
  >(`seqReactionSortOrder-${seqBatch?.id}`);

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
      await onSaved(2);
    }

    if (performSave) {
      setPerformSave(false);
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
   * fetch data when the page is first loaded or editMode changed.
   */
  useEffect(() => {
    fetchSeqReactions();
  }, [editMode]);

  const fetchSeqReactions = async () => {
    const { data: seqReactions } = await apiClient.get<SeqReaction[]>(
      "/seqdb-api/seq-reaction",
      {
        filter: {
          "seqBatch.uuid": seqBatch?.id as string
        },
        include: ["pcrBatchItem", "seqPrimer"].join(","),
        sort: "pcrBatchItem",
        page: { limit: 1000 }
      }
    );

    const pcrBatchItems = compact(
      await bulkGet<PcrBatchItem, true>(
        seqReactions?.map(
          (item) =>
            `/pcr-batch-item/${item.pcrBatchItem?.id}?include=materialSample`
        ),
        {
          apiBaseUrl: "/seqdb-api",
          returnNullForMissingResource: true
        }
      )
    );

    const materialSamples = compact(
      await bulkGet<MaterialSample, true>(
        pcrBatchItems?.map(
          (item) => `/material-sample/${item.materialSample?.id}`
        ),
        {
          apiBaseUrl: "/collection-api",
          returnNullForMissingResource: true
        }
      )
    );

    seqReactions.map((item) => {
      if (item.pcrBatchItem && item.pcrBatchItem?.id) {
        item.pcrBatchItem = pcrBatchItems.find(
          (pbi) => pbi.id === item.pcrBatchItem?.id
        );
        if (
          item.pcrBatchItem?.materialSample &&
          item.pcrBatchItem.materialSample.id
        ) {
          const foundSample = materialSamples.find(
            (sample) => sample.id === item.pcrBatchItem?.materialSample?.id
          );
          (
            item.pcrBatchItem.materialSample as MaterialSample
          ).materialSampleName = foundSample?.materialSampleName;
        }
      }
      return item;
    });

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
      const sorted = sortSeqReactions(seqReactions);
      setSelectedResources(sorted);
    }
  };

  // Sort Seq Reactions based on the preserved order in local storage
  function sortSeqReactions(reactions: SeqReaction[]) {
    if (seqReactionSortOrder) {
      const sorted = seqReactionSortOrder.map((reactionId) =>
        reactions.find((item) => {
          const tempId: (string | undefined)[] = [];
          tempId.push(item.pcrBatchItem?.id);
          tempId.push(item.seqPrimer?.id);
          const id = compact(tempId).join("_");
          return id === reactionId;
        })
      );
      reactions.forEach((item) => {
        const tempId: (string | undefined)[] = [];
        tempId.push(item.pcrBatchItem?.id);
        tempId.push(item.seqPrimer?.id);
        const id = compact(tempId).join("_");
        if (seqReactionSortOrder.indexOf(id) === -1) {
          sorted.push(item);
        }
      });
      return compact(sorted);
    } else {
      return compact(reactions);
    }
  }

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
      },
      page: { limit: 1000 }
    },
    {
      disabled: !selectedPcrBatch,
      onSuccess: async ({ data }) => {
        const materialSamples = compact(
          await bulkGet<MaterialSample, true>(
            data?.map((item) => `/material-sample/${item.materialSample?.id}`),
            {
              apiBaseUrl: "/collection-api",
              returnNullForMissingResource: true
            }
          )
        );

        data.map((item) => {
          if (item.materialSample && item.materialSample.id) {
            const foundSample = materialSamples.find(
              (sample) => sample.id === item.materialSample?.id
            );
            (item.materialSample as MaterialSample).materialSampleName =
              foundSample?.materialSampleName;
          }
          return item;
        });

        data.sort((a, b) => {
          const sampleName1 =
            (a.materialSample as MaterialSample)?.materialSampleName ?? "";
          const sampleName2 =
            (b.materialSample as MaterialSample)?.materialSampleName ?? "";
          return compareByStringAndNumber(sampleName1, sampleName2);
        });

        setAvailableItems(data);
        setSearchResults(data);
      }
    }
  );

  const PCR_BATCH_ITEM_COLUMN: ColumnDef<PcrBatchItem>[] = [
    {
      id: "pcrBatchItemId",
      cell: ({ row }) => (
        <SelectCheckBox key={row.original.id} resource={row.original} />
      ),
      header: () => <SelectCheckBoxHeader />,
      enableSorting: false
    },
    {
      id: "materialSampleName",
      cell: ({ row }) =>
        row.original?.materialSample?.materialSampleName ||
        row.original?.materialSample?.id ||
        "",
      header: () => <FieldHeader name={"sampleName"} />,
      enableSorting: false
    },
    {
      id: "result",
      cell: ({ row }) => (
        <div
          style={{
            backgroundColor:
              "#" + pcrBatchItemResultColor(row.original?.result),
            borderRadius: "5px",
            paddingLeft: "5px"
          }}
        >
          {row.original?.result ?? ""}
        </div>
      ),
      header: () => <FieldHeader name={"result"} />,
      enableSorting: false
    },
    {
      id: "welColumn",
      cell: ({ row }) =>
        row.original?.wellRow === null || row.original?.wellColumn === null
          ? ""
          : row.original.wellRow + "" + row.original.wellColumn,
      header: () => <FieldHeader name={"wellCoordinates"} />,
      enableSorting: false
    },
    {
      id: "tubeNumber",
      cell: ({ row }) => row.original?.cellNumber || "",
      header: () => <FieldHeader name={"tubeNumber"} />,
      enableSorting: false
    }
  ];

  function setSelectedResourcesAndSaveOrder(seqReactions: SeqReaction[]) {
    setSelectedResources(seqReactions);
    setSeqReactionSortOrder(compact(seqReactions.map((item) => item.id)));
  }

  const pcrBatchTable = (
    <div className="d-flex align-items-start col-md-5">
      {pcrBatchItemQuery?.loading ? (
        <LoadingSpinner loading={true} />
      ) : (
        <ReactTable8<PcrBatchItem>
          className="w-100 -striped"
          columns={PCR_BATCH_ITEM_COLUMN}
          data={pcrBatchItemQuery?.response?.data ?? []}
        />
      )}
    </div>
  );

  // Generate the key for the DINA form. It should only be generated once.
  const formKey = useMemo(() => uuidv4(), []);

  //#endregion of PCR Batch item table

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
    // Save ordering when add Seq Reactions.
    // The selectedReasource.id = pcrBatchItem.id + " " + pcrPrimer.id
    setSelectedResourcesAndSaveOrder(selectedResourcesAppended);
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

    // Save ordering when remove Seq Reactions.
    // The selectedReasource.id = pcrBatchItem.id + " " + pcrPrimer.id
    setSeqReactionSortOrder(compact(unselectedObjects.map((item) => item.id)));
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
          <SeqReactionDndTable
            className="-striped"
            editMode={true}
            selectedSeqReactions={selectedResources}
            setSelectedSeqReactions={setSelectedResourcesAndSaveOrder}
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
        <SeqReactionDndTable
          className="react-table-overflow col-md-12 -striped"
          editMode={false}
          selectedSeqReactions={selectedResources}
          setSelectedSeqReactions={setSelectedResourcesAndSaveOrder}
        />
      </div>
    </DinaForm>
  );
}
