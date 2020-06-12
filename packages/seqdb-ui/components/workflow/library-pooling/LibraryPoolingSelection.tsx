import { useLocalStorage } from "@rehooks/local-storage";
import {
  ColumnDefinition,
  ErrorViewer,
  FormikButton,
  QueryTable,
  useGroupedCheckBoxes
} from "common-ui";
import { Formik } from "formik";
import { FilterParam } from "kitsu";
import { debounce, Dictionary, noop } from "lodash";
import { useState } from "react";
import { FilteredChangeFunction } from "react-table";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";
import {
  LibraryPool,
  LibraryPoolContent,
  LibraryPrepBatch
} from "../../../types/seqdb-api";
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

  const [storedHideUsedItems, setHideUsedItems] = useLocalStorage(
    HIDE_USED_ITEMS_KEY
  );
  const hideUsedItems = storedHideUsedItems !== "false";

  const [nameFilter, setNameFilter] = useState<string>("");

  const onNameFilterInputChange: FilteredChangeFunction = debounce(
    (_, __, value) => setNameFilter(value),
    200
  );

  const batchFilter: FilterParam = {
    rsql: `name=='*${nameFilter}*' ${hideUsedItems ? "and dateUsed==null" : ""}`
  };
  const poolFilter = {
    rsql: `libraryPoolId!=${libraryPool.id} and name=='*${nameFilter}*' ${
      hideUsedItems ? "and dateUsed==null" : ""
    }`
  };

  const LIBRARY_PREP_BATCH_TABLE_COLUMNS: Array<ColumnDefinition<
    LibraryPrepBatch
  >> = [
    {
      Header: "Name",
      accessor: "name",
      filterable: true
    },
    "dateUsed",
    {
      Cell: ({ original }) => {
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
      Header: LibraryPrepBatchCheckBoxHeader,
      sortable: false
    }
  ];

  const LIBRARY_POOL_TABLE_COLUMNS: Array<ColumnDefinition<LibraryPool>> = [
    {
      Header: "Name",
      accessor: "name",
      filterable: true
    },
    "dateUsed",
    {
      Cell: ({ original }) => {
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
      Header: LibraryPoolCheckBoxHeader,
      sortable: false
    }
  ];

  const LIBRARY_POOL_CONTENTS_TABLE_COLUMNS: Array<ColumnDefinition<
    LibraryPoolContent
  >> = [
    {
      Cell: ({ original }) => {
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
      Header: "Type",
      sortable: false
    },
    {
      Cell: ({ original: content }) =>
        content.pooledLibraryPrepBatch
          ? content.pooledLibraryPrepBatch.name
          : content.pooledLibraryPool
          ? content.pooledLibraryPool.name
          : "",
      Header: "Name",
      sortable: false
    },
    {
      Cell: ({ original }) => {
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
      Header: DeselectCheckBoxHeader,
      sortable: false
    }
  ];

  return (
    <Formik<LibraryPoolingSelectionFormValues>
      initialValues={{
        libraryPoolContentIdsToDelete: {},
        libraryPoolIdsToSelect: {},
        libraryPrepBatchIdsToSelect: {}
      }}
      onSubmit={noop}
    >
      <>
        <ErrorViewer />
        <div className="row">
          <div className="col-5 library-pool-content-selection-table">
            <div className="float-right">
              <strong>Hide used</strong>
              <input
                className="hide-used-checkbox"
                style={{ width: "20px", height: "20px" }}
                type="checkbox"
                checked={hideUsedItems}
                onChange={e => setHideUsedItems(String(e.target.checked))}
              />
            </div>
            <Tabs>
              <TabList>
                <Tab>Library Prep Batches</Tab>
                <Tab>Library Pools</Tab>
              </TabList>
              <TabPanel>
                <QueryTable<LibraryPrepBatch>
                  columns={LIBRARY_PREP_BATCH_TABLE_COLUMNS}
                  deps={[lastSave]}
                  filter={batchFilter}
                  onSuccess={res => setAvailableBatchs(res.data)}
                  path="libraryPrepBatch"
                  reactTableProps={{
                    defaultFiltered: [{ id: "name", value: nameFilter }],
                    getTrProps: () => ({
                      style: { background: "rgb(222, 252, 222)" }
                    }),
                    onFilteredChange: onNameFilterInputChange
                  }}
                />
              </TabPanel>
              <TabPanel>
                <QueryTable<LibraryPool>
                  columns={LIBRARY_POOL_TABLE_COLUMNS}
                  deps={[lastSave]}
                  filter={poolFilter}
                  onSuccess={res => setAvailablePools(res.data)}
                  path="libraryPool"
                  reactTableProps={{
                    defaultFiltered: [{ id: "name", value: nameFilter }],
                    getTrProps: () => ({
                      style: { background: "rgb(168, 209, 255)" }
                    }),
                    onFilteredChange: onNameFilterInputChange
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
                  Select all checked pooling items -->
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
            <QueryTable<LibraryPoolContent>
              columns={LIBRARY_POOL_CONTENTS_TABLE_COLUMNS}
              deps={[lastSave]}
              include="pooledLibraryPrepBatch,pooledLibraryPool"
              onSuccess={res => setLibraryPoolContents(res.data)}
              path={`libraryPool/${libraryPool.id}/contents`}
              reactTableProps={{
                getTrProps: (_, rowInfo) => {
                  if (rowInfo) {
                    const lpc: LibraryPoolContent = rowInfo.original;
                    return {
                      style: {
                        background: lpc.pooledLibraryPrepBatch
                          ? "rgb(222, 252, 222)"
                          : "rgb(168, 209, 255)"
                      }
                    };
                  }
                  return {};
                }
              }}
            />
          </div>
        </div>
      </>
    </Formik>
  );
}
