import {
  ColumnDefinition,
  ErrorViewer,
  FormikButton,
  QueryTable,
  useGroupedCheckBoxes
} from "common-ui";
import { Formik } from "formik";
import { Dictionary, noop } from "lodash";
import {
  LibraryPool,
  LibraryPoolContent,
  LibraryPrepBatch,
  StepResource
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

  const LIBRARY_PREP_BATCH_TABLE_COLUMNS: Array<
    ColumnDefinition<StepResource>
  > = [
    "chain.name",
    "libraryPrepBatch.id",
    {
      Cell: ({ original }) => {
        const batch: LibraryPrepBatch = original.libraryPrepBatch;

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

  const LIBRARY_POOL_TABLE_COLUMNS: Array<ColumnDefinition<StepResource>> = [
    "libraryPool.name",
    {
      Cell: ({ original }) => {
        const pool: LibraryPool = original.libraryPool;

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

  const LIBRARY_POOL_CONTENTS_TABLE_COLUMNS: Array<
    ColumnDefinition<LibraryPoolContent>
  > = [
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
          ? `Library ${content.pooledLibraryPrepBatch.id}`
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
              className="btn btn-dark btn-sm col-6 single-select-button"
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
          <div className="col-5">
            <div className="form-group">
              <strong>Library Prep Batches</strong>
              <QueryTable<StepResource>
                columns={LIBRARY_PREP_BATCH_TABLE_COLUMNS}
                deps={[lastSave]}
                filter={{
                  rsql: "libraryPrepBatch.libraryPrepBatchId!=null"
                }}
                include="chain,libraryPrepBatch"
                onSuccess={res =>
                  setAvailableBatchs(res.data.map(sr => sr.libraryPrepBatch))
                }
                path="stepResource"
              />
            </div>
            <div className="form-group">
              <strong>Library Pools</strong>
              <QueryTable<StepResource>
                columns={LIBRARY_POOL_TABLE_COLUMNS}
                deps={[lastSave]}
                filter={{
                  rsql: `libraryPool.libraryPoolId!=${libraryPool.id}`
                }}
                include="libraryPool"
                onSuccess={res =>
                  setAvailablePools(res.data.map(sr => sr.libraryPool))
                }
                path="stepResource"
              />
            </div>
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
          <div className="col-5">
            <strong>Selected Pool Contents</strong>
            <QueryTable<LibraryPoolContent>
              columns={LIBRARY_POOL_CONTENTS_TABLE_COLUMNS}
              deps={[lastSave]}
              include="pooledLibraryPrepBatch,pooledLibraryPool"
              onSuccess={res => setLibraryPoolContents(res.data)}
              path={`libraryPool/${libraryPool.id}/contents`}
            />
          </div>
        </div>
      </>
    </Formik>
  );
}
