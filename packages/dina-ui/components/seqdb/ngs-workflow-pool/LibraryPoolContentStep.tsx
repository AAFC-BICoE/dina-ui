import { useLocalStorage } from "@rehooks/local-storage";
import { ColumnDef, ColumnFiltersState } from "@tanstack/react-table";
import {
  ColumnDefinition,
  DinaForm,
  DoOperationsError,
  FormikButton,
  QueryTable,
  ReactTable,
  filterBy,
  useAccount,
  useApiClient,
  useGroupedCheckBoxes
} from "common-ui";
import { FormikContextType } from "formik";
import { FilterParam, PersistedResource } from "kitsu";
import {
  Dictionary,
  compact,
  concat,
  debounce,
  toPairs,
  uniq,
  remove
} from "lodash";
import { useEffect, useState } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";
import {
  LibraryPool2,
  LibraryPoolContent2,
  LibraryPrepBatch2
} from "../../../types/seqdb-api";

const HIDE_USED_ITEMS_KEY = "pooling-search-hide-used";

export interface LibraryPoolContentStepProps {
  libraryPoolId: string;
  libraryPool: LibraryPool2;
  onSaved: (
    nextStep: number,
    libraryPoolSaved?: PersistedResource<LibraryPool2>
  ) => Promise<void>;
  editMode: boolean;
  setEditMode: (newValue: boolean) => void;
  performSave: boolean;
  setPerformSave: (newValue: boolean) => void;
}

interface LibraryPoolingSelectionFormValues {
  libraryPoolContentIdsToDelete: Dictionary<boolean>;
  libraryPoolIdsToSelect: Dictionary<boolean>;
  libraryPrepBatchIdsToSelect: Dictionary<boolean>;
}

export function LibraryPoolContentStep({
  libraryPoolId,
  libraryPool,
  editMode,
  onSaved,
  setEditMode,
  performSave,
  setPerformSave
}: LibraryPoolContentStepProps) {
  const { apiClient, doOperations, save } = useApiClient();
  const { username } = useAccount();
  // Check if a save was requested from the top level button bar.
  useEffect(() => {
    async function performSaveInternal() {
      await saveLibraryPoolContents();
      setPerformSave(false);
      await onSaved(1);
    }

    if (performSave) {
      performSaveInternal();
    }
  }, [performSave]);

  const saveLibraryPoolContents = async () => {
    try {
      const resources = selectedResources.map((item) => {
        if (item.id?.startsWith("tmp_")) {
          // newly added content should have empty id;
          delete item.id;
        }

        (item as any).relationships = {};
        (item as any).relationships.libraryPool = {
          data: {
            id: item.libraryPool.id,
            type: "library-pool"
          }
        };
        delete (item as any).libraryPool;

        if (item.pooledLibraryPool) {
          (item as any).relationships.pooledLibraryPool = {
            data: {
              id: item.pooledLibraryPool.id,
              type: "library-pool"
            }
          };
          delete item.pooledLibraryPool;
        }
        if (item.pooledLibraryPrepBatch) {
          (item as any).relationships.pooledLibraryPrepBatch = {
            data: {
              id: item.pooledLibraryPrepBatch.id,
              type: "library-prep-batch"
            }
          };
          delete item.pooledLibraryPrepBatch;
        }
        return { resource: item, type: item.type };
      });
      if (resources.length > 0) {
        await save(resources, { apiBaseUrl: "seqdb-api/library-pool-content" });
      }

      if (toDelete.length > 0) {
        await doOperations(
          toDelete.map((content) => ({
            op: "DELETE",
            path: `/library-pool-content/${content.id}`
          })),
          { apiBaseUrl: "/seqdb-api" }
        );
      }
      setEditMode(false);
    } catch (e) {
      if (e.toString() === "Error: Access is denied") {
        throw new DoOperationsError("Access is denied");
      }
    }
  };

  const [selectedResources, setSelectedResources] = useState<
    LibraryPoolContent2[]
  >([]);
  const [toDelete, setToDelete] = useState<LibraryPoolContent2[]>([]);

  /**
   * When the page is first loaded, check if saved Library Pool Contents has already been chosen and reload them.
   */
  useEffect(() => {
    fetchLibraryPoolContents();
  }, [editMode]);

  /**
   * Retrieve all of the PCR Batch Items that are associated with the PCR Batch from step 1.
   */
  async function fetchLibraryPoolContents() {
    const response = await apiClient.get<LibraryPoolContent2[]>(
      "/seqdb-api/library-pool-content",
      {
        filter: filterBy([], {
          extraFilters: [
            {
              selector: "libraryPool.uuid",
              comparison: "==",
              arguments: libraryPoolId
            }
          ]
        })(""),
        include: "libraryPool,pooledLibraryPrepBatch,pooledLibraryPool",
        page: {
          limit: 1000 // Maximum page size.
        }
      }
    );
    setSelectedResources(response.data);
    setLibraryPoolContents(response.data);
  }

  const {
    CheckBoxField: LibraryPrepBatchCheckBox,
    CheckBoxHeader: LibraryPrepBatchCheckBoxHeader,
    setAvailableItems: setAvailableBatches,
    availableItems: availableBatches
  } = useGroupedCheckBoxes({ fieldName: "libraryPrepBatchIdsToSelect" });

  const {
    CheckBoxField: LibraryPoolCheckBox,
    CheckBoxHeader: LibraryPoolCheckBoxHeader,
    setAvailableItems: setAvailablePools,
    availableItems: availablePools
  } = useGroupedCheckBoxes({ fieldName: "libraryPoolIdsToSelect" });

  const {
    CheckBoxField: DeselectCheckBox,
    CheckBoxHeader: DeselectCheckBoxHeader,
    setAvailableItems: setLibraryPoolContents
  } = useGroupedCheckBoxes({ fieldName: "libraryPoolContentIdsToDelete" });

  const [storedHideUsedItems, setHideUsedItems] =
    useLocalStorage(HIDE_USED_ITEMS_KEY);
  const hideUsedItems = storedHideUsedItems !== "false";

  const [nameFilter, setNameFilter] = useState<string>("");

  const onNameFilterInputChange: (filters: ColumnFiltersState) => void =
    debounce(
      (filters) =>
        setNameFilter(
          "" + (filters.find((filter) => filter.id === "name")?.value ?? "")
        ),
      1000
    );
  const batchFilter: FilterParam = {
    rsql: `name=='*${nameFilter}*' ${hideUsedItems ? "and dateUsed==null" : ""}`
  };
  const poolFilter = {
    rsql: `uuid!=${libraryPool.id} and name=='*${nameFilter}*' ${
      hideUsedItems ? "and dateUsed==null" : ""
    }`
  };

  const LIBRARY_PREP_BATCH_TABLE_COLUMNS: ColumnDefinition<LibraryPrepBatch2>[] =
    [
      {
        id: "select",
        cell: ({ row: { original } }) => (
          <LibraryPrepBatchCheckBox resource={original} />
        ),
        header: () => <LibraryPrepBatchCheckBoxHeader />,
        enableColumnFilter: false,
        enableSorting: false
      },
      {
        header: "Name",
        accessorKey: "name"
      },
      {
        header: "dateUsed",
        accessorKey: "dateUsed",
        enableColumnFilter: false
      }
    ];

  const LIBRARY_POOL_TABLE_COLUMNS: ColumnDefinition<LibraryPool2>[] = [
    {
      id: "select",
      cell: ({ row: { original } }) => (
        <LibraryPoolCheckBox resource={original} />
      ),
      header: () => <LibraryPoolCheckBoxHeader />,
      enableSorting: false
    },
    {
      header: "Name",
      accessorKey: "name",
      enableColumnFilter: true
    },
    {
      header: "dateUsed",
      accessorKey: "dateUsed",
      enableColumnFilter: false
    }
  ];

  const LIBRARY_POOL_CONTENTS_SELECT_COLUMN: ColumnDef<LibraryPoolContent2>[] =
    editMode
      ? [
          {
            id: "select",
            cell: ({ row: { original } }) => (
              <DeselectCheckBox resource={original} />
            ),
            header: () => <DeselectCheckBoxHeader />,
            enableSorting: false
          }
        ]
      : [];
  const LIBRARY_POOL_CONTENTS_TABLE_COLUMNS: ColumnDef<LibraryPoolContent2>[] =
    [
      ...LIBRARY_POOL_CONTENTS_SELECT_COLUMN,
      {
        cell: ({ row: { original } }) => (
          <>
            {original.pooledLibraryPrepBatch
              ? "Library"
              : original.pooledLibraryPool
              ? "Library Pool"
              : ""}
          </>
        ),

        header: "Type",
        enableSorting: false
      },
      {
        cell: ({ row: { original } }) => (
          <>
            {original.pooledLibraryPrepBatch
              ? original.pooledLibraryPrepBatch.name
              : original.pooledLibraryPool
              ? original.pooledLibraryPool.name
              : ""}
          </>
        ),
        header: "Name",
        enableSorting: false
      }
    ];

  const onSelectResources = (
    formValues: LibraryPoolingSelectionFormValues,
    formik: FormikContextType<any>
  ) => {
    const { libraryPoolIdsToSelect, libraryPrepBatchIdsToSelect } = formValues;

    const libraryPoolIds = toPairs(libraryPoolIdsToSelect)
      .filter((pair) => pair[1])
      .map((pair) => pair[0])
      .filter(
        (id) =>
          selectedResources.filter(
            (content) =>
              !!content.pooledLibraryPool && content.pooledLibraryPool.id === id
          ).length === 0
      );

    const libraryPrepBatchIds = toPairs(libraryPrepBatchIdsToSelect)
      .filter((pair) => pair[1])
      .map((pair) => pair[0])
      .filter(
        (id) =>
          selectedResources.filter(
            (content) =>
              !!content.pooledLibraryPrepBatch &&
              content.pooledLibraryPrepBatch.id === id
          ).length === 0
      );

    const newPoolContents = [
      ...libraryPoolIds.map<LibraryPoolContent2>((id) => {
        let libraryPoolContent: any = remove(
          toDelete,
          (p) => p.pooledLibraryPool?.id === id
        );

        if (libraryPoolContent.length > 0) {
          setToDelete(toDelete);
          libraryPoolContent = libraryPoolContent[0];
        } else {
          const pooledLibraryPool = availablePools.find((p) => p.id === id);
          libraryPoolContent = {
            id: `tmp_library_pool_${id}`,
            type: "library-pool-content",
            createdBy: username,
            libraryPool,
            pooledLibraryPool
          } as LibraryPoolContent2;
        }
        return libraryPoolContent;
      }),
      ...libraryPrepBatchIds.map<LibraryPoolContent2>((id) => {
        let libraryPoolContent: any = remove(
          toDelete,
          (p) => p.pooledLibraryPrepBatch?.id === id
        );
        if (libraryPoolContent.length > 0) {
          setToDelete(toDelete);
          libraryPoolContent = libraryPoolContent[0];
        } else {
          const pooledLibraryPrepBatch = availableBatches.find(
            (p) => p.id === id
          );
          libraryPoolContent = {
            id: `tmp_library_prep_batch_${id}`,
            type: "library-pool-content",
            createdBy: username,
            libraryPool,
            pooledLibraryPrepBatch
          } as LibraryPoolContent2;
        }
        return libraryPoolContent;
      })
    ];

    if (newPoolContents.length > 0) {
      const temp = concat(selectedResources, newPoolContents);
      setSelectedResources(temp);
      setLibraryPoolContents(temp);
    }

    formik.setFieldValue("libraryPoolIdsToSelect", {});
    formik.setFieldValue("libraryPrepBatchIdsToSelect", {});
  };

  const onDeleteResources = (
    formValues: LibraryPoolingSelectionFormValues,
    formik: FormikContextType<any>
  ) => {
    const { libraryPoolContentIdsToDelete } = formValues;

    const tmp = toPairs(libraryPoolContentIdsToDelete)
      .filter((pair) => pair[1])
      .map((pair) => pair[0]);

    if (tmp.length > 0) {
      const resourcesAfterDelete = selectedResources.filter(
        (content) => tmp.indexOf(content.id as string) === -1
      );
      setSelectedResources(resourcesAfterDelete);
      setLibraryPoolContents(resourcesAfterDelete);

      const resourcesToDelete = selectedResources.filter(
        (content) => tmp.indexOf(content.id as string) > -1
      );
      const newToDelete = uniq(
        concat(
          toDelete,
          compact(resourcesToDelete.filter((r) => !r.id?.startsWith("tmp_")))
        )
      );
      setToDelete(newToDelete);
    }

    formik.setFieldValue("libraryPoolContentIdsToDelete", {});
  };

  return (
    <DinaForm<LibraryPoolingSelectionFormValues>
      initialValues={{
        libraryPoolContentIdsToDelete: {},
        libraryPoolIdsToSelect: {},
        libraryPrepBatchIdsToSelect: {}
      }}
    >
      <div className="row">
        {editMode && (
          <>
            <div className="col-5 library-pool-content-selection-table">
              <div className="float-end">
                <strong>Hide used</strong>
                <input
                  className="hide-used-checkbox"
                  style={{ width: "20px", height: "20px" }}
                  type="checkbox"
                  checked={hideUsedItems}
                  onChange={(e) => setHideUsedItems(String(e.target.checked))}
                />
              </div>
              <Tabs>
                <TabList>
                  <Tab>Library Prep Batches</Tab>
                  <Tab>Library Pools</Tab>
                </TabList>
                <TabPanel>
                  <QueryTable<LibraryPrepBatch2>
                    columns={LIBRARY_PREP_BATCH_TABLE_COLUMNS}
                    deps={[]}
                    filter={batchFilter}
                    onSuccess={(res) => setAvailableBatches(res.data)}
                    path="seqdb-api/library-prep-batch"
                    enableFilters={true}
                    reactTableProps={{
                      defaultColumnFilters: [{ id: "name", value: nameFilter }],
                      rowStyling: () => ({ background: "rgb(222, 252, 222" }),
                      onColumnFiltersChange: onNameFilterInputChange
                    }}
                  />
                </TabPanel>
                <TabPanel>
                  <QueryTable<LibraryPool2>
                    columns={LIBRARY_POOL_TABLE_COLUMNS}
                    deps={[]}
                    filter={poolFilter}
                    enableFilters={true}
                    onSuccess={(res) => setAvailablePools(res.data)}
                    path="seqdb-api/library-pool"
                    reactTableProps={{
                      defaultColumnFilters: [{ id: "name", value: nameFilter }],
                      rowStyling: () => ({ background: "rgb(168, 209, 255" }),
                      onColumnFiltersChange: onNameFilterInputChange
                    }}
                  />
                </TabPanel>
              </Tabs>
            </div>
            <div className="col-2 mt-5">
              <div className="select-all-checked-button">
                <FormikButton
                  className="btn btn-primary w-100 mb-5"
                  onClick={onSelectResources}
                >
                  <FiChevronRight />
                </FormikButton>
              </div>
              <div className="deselect-all-checked-button">
                <FormikButton
                  className="btn btn-dark w-100 mb-5"
                  onClick={onDeleteResources}
                >
                  <FiChevronLeft />
                </FormikButton>
              </div>
            </div>
          </>
        )}
        <div
          className={`library-pool-content-table ${
            editMode ? "col-5" : "col-12"
          }`}
        >
          <strong>Selected Pool Contents</strong>
          <ReactTable<LibraryPoolContent2>
            columns={LIBRARY_POOL_CONTENTS_TABLE_COLUMNS}
            data={selectedResources}
            rowStyling={(row) => {
              if (row) {
                const lpc: LibraryPoolContent2 = row.original;
                return {
                  background: lpc.pooledLibraryPrepBatch
                    ? "rgb(222, 252, 222)"
                    : "rgb(168, 209, 255)"
                };
              }
              return {};
            }}
          />
        </div>
      </div>
    </DinaForm>
  );
}
