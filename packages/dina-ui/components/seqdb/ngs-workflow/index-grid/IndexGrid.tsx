import {
  filterBy,
  LoadingSpinner,
  ResourceSelectField,
  SubmitButton,
  ReactTable,
  DinaForm
} from "common-ui";
import {
  LibraryPrep,
  LibraryPrepBatch,
  NgsIndex
} from "../../../../types/seqdb-api";
import { useIndexGridControls } from "./useIndexGridControls";
import { ColumnDef } from "@tanstack/react-table";
import { IndexAssignmentStepProps } from "../IndexAssignmentStep";

export interface CellData {
  libraryPrep?: LibraryPrep;
  row: number;
}

export function IndexGrid(props: IndexAssignmentStepProps) {
  const { batch: libraryPrepBatch } = props;

  const { indexSet } = libraryPrepBatch;

  const { libraryPrepsLoading, libraryPreps, storageUnitType, onSubmit } =
    useIndexGridControls(props);

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
              <strong>{rowLetter}</strong>
              {/* <ResourceSelectField<NgsIndex>
                hideLabel={true}
                filter={filterBy(["name"])}
                name={`indexI5s[${rowLetter}]`}
                optionLabel={(primer) => primer.name}
                model={`seqdb-api/indexSet/${indexSet.id}/ngsIndexes`}
                styles={{ menu: () => ({ zIndex: 5 }) }}
              /> */}
            </div>
          )
        );
      },
      id: "rowNumber",
      accessorKey: "",
      enableResizing: false,
      enableSorting: false
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
              <div>{prep.materialSample?.materialSampleName}</div>
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
              <strong>{columnLabel}</strong>
              {/* <ResourceSelectField<NgsIndex>
                hideLabel={true}
                filter={filterBy(["name"])}
                name={`indexI7s[${columnLabel}]`}
                optionLabel={(primer) => primer.name}
                model={`seqdb-api/indexSet/${indexSet.id}/ngsIndexes`}
                styles={{ menu: () => ({ zIndex: 5 }) }}
              /> */}
            </>
          ),
        id: `${columnLabel}`,
        accessorKey: `${columnLabel}`,
        enableResizing: false,
        enableSorting: false
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
        onSubmit={onSubmit}
      >
        <div style={{ height: "50px" }}>
          <div className="float-right">
            <SubmitButton />
          </div>
        </div>
        <ReactTable<CellData>
          columns={columns}
          data={tableData}
          showPagination={false}
        />
      </DinaForm>
    );
  }

  return null;
}
