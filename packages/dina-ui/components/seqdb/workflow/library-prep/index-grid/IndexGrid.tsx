import {
  DinaForm,
  filterBy,
  LoadingSpinner,
  ReactTable8,
  ResourceSelectField,
  SubmitButton
} from "common-ui";
import { ColumnDef } from "@tanstack/react-table";
import { SeqdbMessage } from "../../../../../intl/seqdb-intl";
import {
  LibraryPrep,
  LibraryPrepBatch,
  NgsIndex
} from "../../../../../types/seqdb-api";
import { useIndexGridControls } from "./useIndexGridControls";

export interface IndexGridProps {
  libraryPrepBatch: LibraryPrepBatch;
}

export function IndexGrid(props: IndexGridProps) {
  const { libraryPrepBatch } = props;

  const { containerType, indexSet } = libraryPrepBatch;

  const { libraryPrepsLoading, libraryPrepsResponse, onSubmit } =
    useIndexGridControls(props);

  if (libraryPrepsLoading) {
    return <LoadingSpinner loading={true} />;
  }

  if (!containerType || !indexSet) {
    return (
      <span className="alert alert-warning">
        Container Type and Index Set must be set to use the index grid.
      </span>
    );
  }

  if (libraryPrepsResponse) {
    const libraryPreps = libraryPrepsResponse.data;

    const libraryPrepsWithCoords = libraryPreps.filter(
      (prep) => prep.wellRow && prep.wellColumn
    );

    const cellGrid: { [key: string]: LibraryPrep } = {};
    for (const prep of libraryPrepsWithCoords) {
      cellGrid[`${prep.wellRow}_${prep.wellColumn}`] = prep;
    }

    const columns: ColumnDef<any>[] = [];

    // Add the primer column:
    columns.push({
      id: "indexColumn",
      cell: ({ row: { index } }) => {
        const rowLetter = String.fromCharCode(index + 65);

        return (
          libraryPrepBatch.indexSet && (
            <div style={{ padding: "7px 5px" }}>
              <span>{String.fromCharCode(index + 65)}</span>
              <ResourceSelectField<NgsIndex>
                hideLabel={true}
                filter={filterBy(["name"])}
                name={`indexI5s[${rowLetter}]`}
                optionLabel={(primer) => primer.name}
                model={`seqdb-api/index-set/${libraryPrepBatch.indexSet.id}/ngsIndexes`}
                styles={{ menu: () => ({ zIndex: 5 }) }}
              />
            </div>
          )
        );
      },
      enableSorting: false
    });

    for (let col = 0; col < containerType.numberOfColumns; col++) {
      const columnLabel = String(col + 1);

      columns.push({
        id: `column-${col}`,
        cell: ({ row: { index } }) => {
          const rowLabel = String.fromCharCode(index + 65);
          const coords = `${rowLabel}_${columnLabel}`;
          const prep = cellGrid[coords];

          return prep ? (
            <div className="h-100 w-100 list-group-item">
              <div>{prep.molecularSample.name}</div>
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
          libraryPrepBatch.indexSet && (
            <>
              {columnLabel}
              <ResourceSelectField<NgsIndex>
                hideLabel={true}
                filter={filterBy(["name"])}
                name={`indexI7s[${columnLabel}]`}
                optionLabel={(primer) => primer.name}
                model={`seqdb-api/index-set/${libraryPrepBatch.indexSet.id}/ngsIndexes`}
                styles={{ menu: () => ({ zIndex: 5 }) }}
              />
            </>
          ),
        enableSorting: false
      });
    }

    const tableData = new Array(containerType.numberOfRows).fill({});

    return (
      <DinaForm
        initialValues={{ indexI5s: {}, indexI7s: {} }}
        onSubmit={onSubmit}
      >
        <style>{`
          .rt-td {
            padding: 0 !important;
          }
        `}</style>
        <div className="alert alert-warning d-inline-block">
          <SeqdbMessage id="indexGridInstructions" />
        </div>
        <div>
          <SubmitButton className="mb-3" />
        </div>
        <ReactTable8<any>
          columns={columns}
          data={tableData}
          showPagination={false}
        />
      </DinaForm>
    );
  }

  return null;
}
