import { useLocalStorage } from "@rehooks/local-storage";
import { ColumnFiltersState } from "@tanstack/react-table";
import { debounce } from "lodash";
import {
  ColumnDefinition8,
  DinaForm,
  FieldHeader,
  FormikButton,
  QueryTable8,
  useGroupedCheckBoxes
} from "common-ui";
import { FilterParam } from "kitsu";
import { Dictionary } from "lodash";
import { useState } from "react";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";
import {
  LibraryPool,
  LibraryPoolContent,
  LibraryPrepBatch
} from "../../../../types/seqdb-api";
import { useLibraryPoolingSelectionControls } from "./useLibraryPoolingSelectionControls";

export interface LibraryPoolingSelectionProps {
  libraryPool: LibraryPool;
}

export interface LibraryPoolingSelectionFormValues {
  libraryPoolContentIdsToDelete: Dictionary<boolean>;
  libraryPoolIdsToSelect: Dictionary<boolean>;
  libraryPrepBatchIdsToSelect: Dictionary<boolean>;
}

const HIDE_USED_ITEMS_KEY = "pooling-search-hide-used";

export function LibraryPoolingSelection(props: LibraryPoolingSelectionProps) {
  const {
    deleteAllCheckedItems,
    deleteLibraryPoolContents,
    lastSave,
    selectAllCheckedItems,
    selectPooledItems
  } = useLibraryPoolingSelectionControls(props);

  const { libraryPool } = props;

  const {
    CheckBoxField: LibraryPrepBatchCheckBox,
    CheckBoxHeader: LibraryPrepBatchCheckBoxHeader,
    setAvailableItems: setAvailableBatchs
  } = useGroupedCheckBoxes({ fieldName: "libraryPrepBatchIdsToSelect" });

  const {
    CheckBoxField: LibraryPoolCheckBox,
    CheckBoxHeader: LibraryPoolCheckBoxHeader,
    setAvailableItems: setAvailablePools
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

  // function onNameFilterInputChange(filters: ColumnFiltersState) {
  //   setNameFilter(
  //     "" + (filters.find((filter) => filter.id === "name")?.value ?? "")
  //   );
  // }
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

  const LIBRARY_PREP_BATCH_TABLE_COLUMNS: ColumnDefinition8<LibraryPrepBatch>[] =
    [
      {
        header: "Name",
        accessorKey: "name"
      },
      {
        header: () => <FieldHeader name="dateUsed" />,
        accessorKey: "dateUsed",
        enableColumnFilter: false
      },
      {
        id: "select",
        cell: ({ row: { original } }) => {
          const batch: LibraryPrepBatch = original;

          return (
            <div className="row" key={batch.id}>
              <FormikButton
                className="btn btn-primary btn-sm col-6 single-select-button"
                onClick={async (_, formik) => {
                  await selectPooledItems([batch]);
                  formik.setFieldValue(
                    `libraryPrepBatchIdsToSelect[${batch.id}]`,
                    undefined
                  );
                }}
              >
                Select
              </FormikButton>
              <div className="col-6">
                <LibraryPrepBatchCheckBox resource={batch} />
              </div>
            </div>
          );
        },
        header: () => <LibraryPrepBatchCheckBoxHeader />,
        enableColumnFilter: false,
        enableSorting: false
      }
    ];

  const LIBRARY_POOL_TABLE_COLUMNS: ColumnDefinition8<LibraryPool>[] = [
    {
      header: "Name",
      accessorKey: "name",
      enableColumnFilter: true
    },
    {
      header: () => <FieldHeader name="dateUsed" />,
      accessorKey: "dateUsed",
      enableColumnFilter: false
    },
    {
      id: "select",
      cell: ({ row: { original } }) => {
        const pool: LibraryPool = original;

        return (
          <div className="row" key={pool.id}>
            <FormikButton
              className="btn btn-primary btn-sm col-6 single-select-button"
              onClick={async (_, formik) => {
                await selectPooledItems([pool]);
                formik.setFieldValue(
                  `libraryPoolIdsToSelect[${pool.id}]`,
                  undefined
                );
              }}
            >
              Select
            </FormikButton>
            <div className="col-6">
              <LibraryPoolCheckBox resource={pool} />
            </div>
          </div>
        );
      },
      header: () => <LibraryPoolCheckBoxHeader />,
      enableSorting: false
    }
  ];

  const LIBRARY_POOL_CONTENTS_TABLE_COLUMNS: ColumnDefinition8<LibraryPoolContent>[] =
    [
      {
        cell: ({ row: { original } }) => {
          const lpc: LibraryPoolContent = original;

          return (
            <>
              {lpc.pooledLibraryPrepBatch
                ? "Library"
                : lpc.pooledLibraryPool
                ? "Library Pool"
                : ""}
            </>
          );
        },
        header: "Type",
        enableSorting: false
      },
      {
        cell: ({ row: { original: content } }) =>
          content.pooledLibraryPrepBatch
            ? content.pooledLibraryPrepBatch.name
            : content.pooledLibraryPool
            ? content.pooledLibraryPool.name
            : "",
        header: "Name",
        enableSorting: false
      },
      {
        id: "select",
        cell: ({ row: { original } }) => {
          const lpc: LibraryPoolContent = original;

          return (
            <div className="row" key={lpc.id}>
              <FormikButton
                className="btn btn-dark btn-sm col-6 single-remove-button"
                onClick={async (_, formik) => {
                  await deleteLibraryPoolContents([lpc]);
                  formik.setFieldValue(
                    `libraryPoolContentIdsToDelete[${lpc.id}]`,
                    undefined
                  );
                }}
              >
                Remove
              </FormikButton>
              <div className="col-6">
                <DeselectCheckBox resource={lpc} />
              </div>
            </div>
          );
        },
        header: () => <DeselectCheckBoxHeader />,
        enableSorting: false
      }
    ];

  return (
    <DinaForm<LibraryPoolingSelectionFormValues>
      initialValues={{
        libraryPoolContentIdsToDelete: {},
        libraryPoolIdsToSelect: {},
        libraryPrepBatchIdsToSelect: {}
      }}
    >
      <>
        <div className="row">
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
                <QueryTable8<LibraryPrepBatch>
                  columns={LIBRARY_PREP_BATCH_TABLE_COLUMNS}
                  deps={[lastSave]}
                  filter={batchFilter}
                  onSuccess={(res) => setAvailableBatchs(res.data)}
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
                <QueryTable8<LibraryPool>
                  columns={LIBRARY_POOL_TABLE_COLUMNS}
                  deps={[lastSave]}
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
          <div className="col-2" style={{ marginTop: "100px" }}>
            <div className="row">
              <div className="col-6">
                <FormikButton
                  className="btn btn-primary select-all-checked-button"
                  onClick={selectAllCheckedItems}
                >
                  Select all checked pooling items {"-->"}
                </FormikButton>
              </div>
              <div className="col-6">
                <FormikButton
                  className="btn btn-dark deselect-all-checked-button"
                  onClick={deleteAllCheckedItems}
                >
                  {"<--"} Deselect all checked pooling items
                </FormikButton>
              </div>
            </div>
          </div>
          <div className="col-5 library-pool-content-table">
            <strong>Selected Pool Contents</strong>
            <QueryTable8<LibraryPoolContent>
              columns={LIBRARY_POOL_CONTENTS_TABLE_COLUMNS}
              deps={[lastSave]}
              include="pooledLibraryPrepBatch,pooledLibraryPool"
              onSuccess={(res) => setLibraryPoolContents(res.data)}
              path={`seqdb-api/library-pool/${libraryPool.id}/contents`}
              reactTableProps={{
                rowStyling: (row) => {
                  if (row) {
                    const lpc: LibraryPoolContent = row.original;
                    return {
                      background: lpc.pooledLibraryPrepBatch
                        ? "rgb(222, 252, 222)"
                        : "rgb(168, 209, 255)"
                    };
                  }
                  return {};
                }
              }}
            />
          </div>
        </div>
      </>
    </DinaForm>
  );
}
