import {
  DinaForm,
  FieldHeader,
  filterBy,
  FormikButton,
  LoadingSpinner,
  ReactTable,
  ResourceSelectField,
  TextField,
  useAccount,
  useApiClient,
  useGroupedCheckBoxes,
  useQuery,
  useStringComparator
} from "common-ui";
import { FormikContextType } from "formik";
import { PersistedResource } from "kitsu";
import { compact, pick, toPairs, uniqBy } from "lodash";
import { DinaMessage, useDinaIntl } from "packages/dina-ui/intl/dina-ui-intl";
import { MaterialSample } from "packages/dina-ui/types/collection-api";
import { useEffect, useMemo, useState } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { BiChevronsRight } from "react-icons/bi";
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
import { useSeqReactionState } from "./seq-reaction-step/useSeqReactionState";
import { StorageUnitUsage } from "packages/dina-ui/types/collection-api/resources/StorageUnitUsage";
import { MolecularAnalysisRunItem } from "packages/dina-ui/types/seqdb-api/resources/molecular-analysis/MolecularAnalysisRunItem";

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
  const { save, bulkGet } = useApiClient();
  const { formatMessage } = useDinaIntl();
  const { isAdmin, groupNames, username } = useAccount();
  const [searchResult, setSearchResults] = useState<PcrBatchItem[]>([]);
  const [pcrBatchItems, setPcrBatchItems] = useState<PcrBatchItem[]>([]);
  const [selectedPcrPrimer, setSelectedPcrPrimer] = useState<PcrPrimer>();
  const [group, setGroup] = useState(
    groupNames && groupNames.length > 0 ? groupNames[0] : ""
  );
  const [selectedPcrBatch, setSelectedPcrBatch] = useState<PcrBatch>();
  const [selectedRegion, setSelectedRegion] = useState<Region>();
  const { compareByStringAndNumber } = useStringComparator();
  const {
    selectedResources,
    setSelectedResources,
    setSeqReactionSortOrder,
    previouslySelectedResourcesIDMap,
    setPreviouslySelectedResourcesIDMap,
    loadingSeqReactions
  } = useSeqReactionState(seqBatch?.id);
  const [initialSeqReactions, setInitialSeqReactions] = useState<SeqReaction[]>(
    []
  );

  useEffect(() => {
    if (selectedResources.length !== 0 && initialSeqReactions?.length === 0) {
      setInitialSeqReactions(selectedResources);
    }
  }, [selectedResources]);

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

    const initialResourceMap = compact(initialSeqReactions).reduce(
      (accu, obj) => ({
        ...accu,
        [`${obj.pcrBatchItem?.id}_${obj.seqPrimer?.id}`]: obj
      }),
      {} as { [key: string]: SeqReaction }
    );

    const allItems: SeqReaction[] = Object.keys(initialResourceMap).map(
      (key) => initialResourceMap[key]
    );

    const itemsToCreate: SeqReaction[] = Object.keys(selectedResourceMap)
      .filter((key) => !previouslySelectedResourcesIDMap[key])
      .map((key) => selectedResourceMap[key]);

    const itemsToDelete: SeqReaction[] = compact(
      Object.keys(previouslySelectedResourcesIDMap)
        .filter((key) => !selectedResourceMap[key])
        .map((key) => initialResourceMap[key])
    );

    const runId = allItems.find(
      (item) => item?.molecularAnalysisRunItem?.run?.id
    )?.molecularAnalysisRunItem?.run?.id;

    // Perform create
    if (itemsToCreate.length !== 0) {
      // If a molecular analysis exists on other seqReactions, then we need to create a
      // molecular analysis run item.
      let molecularRunItemsCreated: MolecularAnalysisRunItem[] = [];
      if (runId) {
        molecularRunItemsCreated = await save<MolecularAnalysisRunItem>(
          itemsToCreate.map((_) => ({
            resource: {
              type: "molecular-analysis-run-item",
              usageType: "seq-reaction",
              relationships: {
                run: {
                  data: {
                    type: "molecular-analysis-run",
                    id: runId
                  }
                }
              }
            },
            type: "molecular-analysis-run-item"
          })),
          { apiBaseUrl: "/seqdb-api" }
        );
      }

      await save(
        itemsToCreate.map((data, index) => ({
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
              },
              // Included only if molecular run items were created.
              molecularAnalysisRunItem:
                molecularRunItemsCreated.length > 0 &&
                molecularRunItemsCreated[index]
                  ? {
                      data: {
                        type: "molecular-analysis-run-item",
                        id: molecularRunItemsCreated[index].id
                      }
                    }
                  : undefined
            }
          },
          type: "seq-reaction"
        })),
        { apiBaseUrl: "/seqdb-api" }
      );
    }

    // Perform deletes
    if (itemsToDelete.length !== 0) {
      // Delete the seq reactions.
      await save(
        itemsToDelete.map((item) => ({
          delete: {
            id: previouslySelectedResourcesIDMap[item.id ?? ""] ?? "",
            type: "seq-reaction"
          }
        })),
        { apiBaseUrl: "/seqdb-api" }
      );

      // Check if molecular analysis items need to be deleted as well.
      if (runId) {
        // Delete the molecular analysis run items.
        await save(
          itemsToDelete.map((item) => ({
            delete: {
              id: item?.molecularAnalysisRunItem?.id ?? "",
              type: "molecular-analysis-run-item"
            }
          })),
          { apiBaseUrl: "/seqdb-api" }
        );

        // Delete the run if all seq-reactions are being deleted.
        if (itemsToDelete.length === allItems.length) {
          await save(
            [
              {
                delete: {
                  id: runId,
                  type: "molecular-analysis-run"
                }
              }
            ],
            { apiBaseUrl: "/seqdb-api" }
          );
        }
      }
    }
    // Clear the previously selected resources.
    setPreviouslySelectedResourcesIDMap({});
  }

  //#region of PCR Batch Item table
  // Checkbox for the first table that lists the search results
  const {
    CheckBoxField: SelectCheckBox,
    CheckBoxHeader: SelectCheckBoxHeader,
    availableItems,
    setAvailableItems
  } = useGroupedCheckBoxes<PcrBatchItem>({
    fieldName: "itemIdsToSelect"
  });

  const pcrBatchItemQuery = useQuery<PcrBatchItem[]>(
    {
      path: `seqdb-api/pcr-batch-item`,
      include: ["pcrBatch", "materialSample", "storageUnitUsage"].join(","),
      filter: {
        "pcrBatch.uuid": selectedPcrBatch?.id as string
      },
      page: { limit: 1000 }
    },
    {
      disabled: !selectedPcrBatch,
      onSuccess: async ({ data }) => {
        let processedPcrBatchItems: PcrBatchItem[] = [];
        const fetchedStorageUnitUsages = await bulkGet<StorageUnitUsage>(
          data.map(
            (item) => "/storage-unit-usage/" + item?.storageUnitUsage?.id
          ),
          {
            apiBaseUrl: "/collection-api",
            returnNullForMissingResource: true
          }
        );
        processedPcrBatchItems = data.map((batchItem) => ({
          ...batchItem,
          storageUnitUsage: fetchedStorageUnitUsages.find(
            (fetchedStorageUnitUsage) =>
              fetchedStorageUnitUsage.id === batchItem.storageUnitUsage?.id
          )
        }));

        const materialSamples = compact(
          await bulkGet<MaterialSample, true>(
            data?.map(
              (item) => `/material-sample-summary/${item.materialSample?.id}`
            ),
            {
              apiBaseUrl: "/collection-api",
              returnNullForMissingResource: true
            }
          )
        );

        processedPcrBatchItems.map((item) => {
          if (item.materialSample && item.materialSample.id) {
            const foundSample = materialSamples.find(
              (sample) => sample.id === item.materialSample?.id
            );
            (item.materialSample as MaterialSample).materialSampleName =
              foundSample?.materialSampleName;
          }
          return item;
        });

        processedPcrBatchItems.sort((a, b) => {
          const sampleName1 =
            (a.materialSample as MaterialSample)?.materialSampleName ?? "";
          const sampleName2 =
            (b.materialSample as MaterialSample)?.materialSampleName ?? "";
          return compareByStringAndNumber(sampleName1, sampleName2);
        });
        setAvailableItems(processedPcrBatchItems);
        setSearchResults(processedPcrBatchItems);
        setPcrBatchItems(processedPcrBatchItems);
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
        row.original?.storageUnitUsage?.wellRow === null ||
        row.original?.storageUnitUsage?.wellColumn === null
          ? ""
          : row.original?.storageUnitUsage?.wellRow +
            "" +
            row.original?.storageUnitUsage?.wellColumn,
      header: () => <FieldHeader name={"wellCoordinates"} />,
      enableSorting: false
    },
    {
      id: "tubeNumber",
      cell: ({ row }) => row.original?.storageUnitUsage?.cellNumber || "",
      header: () => <FieldHeader name={"tubeNumber"} />,
      enableSorting: false
    }
  ];

  function setSelectedResourcesAndSaveOrder(seqReactions: SeqReaction[]) {
    setSelectedResources(seqReactions);
    setSeqReactionSortOrder(compact(seqReactions.map((item) => item.id)));
  }

  const pcrBatchTable = (
    <div className="d-flex align-items-start col-md-4">
      {pcrBatchItemQuery?.loading ? (
        <LoadingSpinner loading={true} />
      ) : (
        <ReactTable<PcrBatchItem>
          className="w-100 -striped"
          columns={PCR_BATCH_ITEM_COLUMN}
          data={pcrBatchItems}
          enableSorting={false}
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

  function addGoodAndWeaks(_formValues, formik: FormikContextType<any>) {
    const ids = availableItems
      .filter(
        (item) => item.result === "Good Band" || item.result === "Weak Band"
      )
      .map((item) => item.id);
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

  return loadingSeqReactions ? (
    <LoadingSpinner loading={true} />
  ) : editMode ? (
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
        <div className="col-md-2">
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
              className="btn btn-primary w-100"
              onClick={addGoodAndWeaks}
            >
              <DinaMessage id="addGoodAndWeakButton" />
              <BiChevronsRight />
            </FormikButton>
          </div>
          <div className="mt-3">
            <FormikButton
              className="btn btn-primary w-100"
              onClick={addSelectedResources}
            >
              <FiChevronRight />
            </FormikButton>
          </div>
          <div className="mt-3">
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
            className="-striped w-100"
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
