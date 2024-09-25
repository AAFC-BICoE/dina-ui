import {
  LoadingSpinner,
  ReactTable,
  DinaForm,
  SelectField,
  SelectOption,
  SubmitButton
} from "common-ui";
import { LibraryPrep } from "../../../../types/seqdb-api";
import { ColumnDef } from "@tanstack/react-table";
import { IndexAssignmentStepProps } from "../IndexAssignmentStep";
import { UseIndexAssignmentReturn } from "../useIndexAssignmentAPI";

interface CellData {
  row: number;
}

interface IndexGridProps
  extends IndexAssignmentStepProps,
    UseIndexAssignmentReturn {}

export function IndexGrid(props: IndexGridProps) {
  const {
    batch: libraryPrepBatch,
    editMode,
    performSave,
    setPerformSave,
    libraryPrepsLoading,
    libraryPreps,
    materialSamples,
    ngsIndexes,
    storageUnitType,
    onSubmitGrid
  } = props;

  const { indexSet } = libraryPrepBatch;

  // Hidden button bar is used to submit the page from the button bar in a parent component.
  const hiddenButtonBar = (
    <SubmitButton
      className="hidden"
      performSave={performSave}
      setPerformSave={setPerformSave}
    />
  );

  if (libraryPrepsLoading) {
    return <LoadingSpinner loading={true} />;
  }

  if (!storageUnitType && !indexSet) {
    return (
      <span className="alert alert-warning">
        Container Type and Index Set must be set to use the index grid.
      </span>
    );
  }

  if (libraryPreps) {
    const libraryPrepsWithCoords = libraryPreps.filter(
      (prep) =>
        prep.storageUnitUsage?.wellRow && prep.storageUnitUsage?.wellColumn
    );

    const cellGrid: { [key: string]: LibraryPrep } = {};
    for (const prep of libraryPrepsWithCoords) {
      cellGrid[
        `${prep.storageUnitUsage?.wellRow}_${prep.storageUnitUsage?.wellColumn}`
      ] = prep;
    }

    const columns: ColumnDef<CellData>[] = [];

    // Add the primer column:
    columns.push({
      cell: ({ row: { original } }) => {
        const rowLetter = String.fromCharCode(original.row + 65);

        return (
          indexSet && (
            <div style={{ padding: "7px 5px" }}>
              <SelectField
                label={rowLetter}
                name={`indexI5s[${rowLetter}]`}
                options={ngsIndexes
                  ?.filter((index) => index.direction === "I5")
                  ?.map<SelectOption<string>>((index) => ({
                    label: index.name,
                    value: index.id
                  }))}
              />
            </div>
          )
        );
      },
      meta: {
        style: {
          position: "sticky",
          left: 0,
          background: "white",
          boxShadow: "7px 0px 9px 0px rgba(0,0,0,0.1)",
          zIndex: 500
        }
      },
      id: "rowNumber",
      accessorKey: "",
      enableResizing: false,
      enableSorting: false,
      size: 300
    });

    // Generate the columns
    for (
      let col = 0;
      col < (storageUnitType?.gridLayoutDefinition?.numberOfColumns ?? 0);
      col++
    ) {
      const columnLabel = String(col + 1);

      columns.push({
        cell: ({ row: { original } }) => {
          const rowLabel = String.fromCharCode(original.row + 65);
          const coords = `${rowLabel}_${columnLabel}`;
          const prep = cellGrid[coords];

          return prep ? (
            <div className="h-100 w-100 list-group-item">
              <div>
                {materialSamples?.find(
                  (sample) => sample.id === prep?.materialSample?.id
                )?.materialSampleName ?? ""}
              </div>
              <div>
                {prep.indexI5 && (
                  <div>
                    <strong>i5: </strong>
                    {prep.indexI5.name}
                  </div>
                )}
                {prep.indexI7 && (
                  <div>
                    <strong>i7: </strong>
                    {prep.indexI7.name}
                  </div>
                )}
              </div>
            </div>
          ) : null;
        },
        header: () =>
          indexSet && (
            <>
              <SelectField
                label={columnLabel}
                name={`indexI7s[${columnLabel}]`}
                options={ngsIndexes
                  ?.filter((index) => index.direction === "I7")
                  ?.map<SelectOption<string>>((index) => ({
                    label: index.name,
                    value: index.id
                  }))}
                className="w-100"
              />
            </>
          ),
        id: `${columnLabel}`,
        accessorKey: `${columnLabel}`,
        enableResizing: false,
        enableSorting: false,
        size: 300
      });
    }

    // Populate the table's rows using the number of rows.
    const tableData: CellData[] = [];
    const numberOfRows =
      storageUnitType?.gridLayoutDefinition?.numberOfRows ?? 0;

    for (let i = 0; i < numberOfRows; i++) {
      tableData.push({ row: i });
    }

    return (
      <DinaForm
        initialValues={{ indexI5s: {}, indexI7s: {} }}
        onSubmit={onSubmitGrid}
        readOnly={editMode === false}
      >
        {hiddenButtonBar}
        <ReactTable<CellData>
          className="-striped react-table-overflow"
          columns={columns}
          data={tableData}
          showPagination={false}
        />
      </DinaForm>
    );
  }

  return null;
}
