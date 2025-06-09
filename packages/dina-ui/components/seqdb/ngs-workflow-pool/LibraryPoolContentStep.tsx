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
import _, { Dictionary } from "lodash";
import { useEffect, useState } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";
import {
  LibraryPool,
  LibraryPoolContent,
  LibraryPrepBatch
} from "../../../types/seqdb-api";
import { DinaMessage } from "packages/dina-ui/intl/dina-ui-intl";

const HIDE_USED_ITEMS_KEY = "pooling-search-hide-used";

export interface LibraryPoolContentStepProps {
  libraryPoolId: string;
  libraryPool: LibraryPool;
  onSaved: (
    nextStep: number,
    libraryPoolSaved?: PersistedResource<LibraryPool>
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
    LibraryPoolContent[]
  >([]);
  const [toDelete, setToDelete] = useState<LibraryPoolContent[]>([]);

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
    const response = await apiClient.get<LibraryPoolContent[]>(
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
    _.debounce(
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

  const LIBRARY_PREP_BATCH_TABLE_COLUMNS: ColumnDefinition<LibraryPrepBatch>[] =
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
        header: () => <DinaMessage id="name" />,
        accessorKey: "name"
      },
      {
        header: () => <DinaMessage id="field_dateUsed" />,
        accessorKey: "dateUsed",
        enableColumnFilter: false
      }
    ];

  const LIBRARY_POOL_TABLE_COLUMNS: ColumnDefinition<LibraryPool>[] = [
    {
      id: "select",
      cell: ({ row: { original } }) => (
        <LibraryPoolCheckBox resource={original} />
      ),
      header: () => <LibraryPoolCheckBoxHeader />,
      enableSorting: false
    },
    {
      header: () => <DinaMessage id="name" />,
      accessorKey: "name",
      enableColumnFilter: true
    },
    {
      header: () => <DinaMessage id="field_dateUsed" />,
      accessorKey: "dateUsed",
      enableColumnFilter: false
    }
  ];

  const LIBRARY_POOL_CONTENTS_SELECT_COLUMN: ColumnDef<LibraryPoolContent>[] =
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
  const LIBRARY_POOL_CONTENTS_TABLE_COLUMNS: ColumnDef<LibraryPoolContent>[] = [
    ...LIBRARY_POOL_CONTENTS_SELECT_COLUMN,
    {
      id: "type",
      cell: ({ row: { original } }) => (
        <>
          {original.pooledLibraryPrepBatch
            ? "Library"
            : original.pooledLibraryPool
            ? "Library Pool"
            : ""}
        </>
      ),
      header: () => <DinaMessage id="field_type" />,
      enableSorting: false
    },
    {
      id: "name",
      cell: ({ row: { original } }) => (
        <>
          {original.pooledLibraryPrepBatch
            ? original.pooledLibraryPrepBatch.name
            : original.pooledLibraryPool
            ? original.pooledLibraryPool.name
            : ""}
        </>
      ),
      header: () => <DinaMessage id="name" />,
      enableSorting: false
    }
  ];

  const onSelectResources = (
    formValues: LibraryPoolingSelectionFormValues,
    formik: FormikContextType<any>
  ) => {
    const { libraryPoolIdsToSelect, libraryPrepBatchIdsToSelect } = formValues;

    const libraryPoolIds = _.toPairs(libraryPoolIdsToSelect)
      .filter((pair) => pair[1])
      .map((pair) => pair[0])
      .filter(
        (id) =>
          selectedResources.filter(
            (content) =>
              !!content.pooledLibraryPool && content.pooledLibraryPool.id === id
          ).length === 0
      );

    const libraryPrepBatchIds = _.toPairs(libraryPrepBatchIdsToSelect)
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
      ...libraryPoolIds.map<LibraryPoolContent>((id) => {
        let libraryPoolContent: any = _.remove(
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
          } as LibraryPoolContent;
        }
        return libraryPoolContent;
      }),
      ...libraryPrepBatchIds.map<LibraryPoolContent>((id) => {
        let libraryPoolContent: any = _.remove(
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
          } as LibraryPoolContent;
        }
        return libraryPoolContent;
      })
    ];

    if (newPoolContents.length > 0) {
      const temp = _.concat(selectedResources, newPoolContents);
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

    const tmp = _.toPairs(libraryPoolContentIdsToDelete)
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
      const newToDelete = _.uniq(
        _.concat(
          toDelete,
          _.compact(resourcesToDelete.filter((r) => !r.id?.startsWith("tmp_")))
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
                <strong>
                  <DinaMessage id="hideUsed" />
                </strong>
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
                  <Tab>
                    <DinaMessage id="libraryPrepBatchListTitle" />
                  </Tab>
                  <Tab>
                    <DinaMessage id="libraryPoolsListTitle" />
                  </Tab>
                </TabList>
                <TabPanel>
                  <QueryTable<LibraryPrepBatch>
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
                  <QueryTable<LibraryPool>
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
          <strong>
            <DinaMessage id="selectedPoolContents" />
          </strong>
          <ReactTable<LibraryPoolContent>
            columns={LIBRARY_POOL_CONTENTS_TABLE_COLUMNS}
            data={selectedResources}
            rowStyling={(row) => {
              if (row) {
                const lpc: LibraryPoolContent = row.original;
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
