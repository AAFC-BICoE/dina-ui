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
import { TableColumn } from "packages/common-ui/lib/list-page/types";

export interface IndexGridProps {
  libraryPrepBatch: LibraryPrepBatch;
}

export function IndexGrid(props: IndexGridProps) {
  const { libraryPrepBatch } = props;

  const { indexSet } = libraryPrepBatch;

  const {
    libraryPrepsLoading,
    libraryPrepsResponse,
    storageUnitType,
    onSubmit
  } = useIndexGridControls(props);

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

  if (libraryPrepsResponse) {
    const libraryPreps = libraryPrepsResponse.data;

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

    const columns: TableColumn<any>[] = [];

    // Add the primer column:
    columns.push({
      cell: ({
        row: {
          original: { data }
        }
      }) => {
        const rowLetter = String.fromCharCode(data + 65);

        return (
          indexSet && (
            <div style={{ padding: "7px 5px" }}>
              <span>{String.fromCharCode(data + 65)}</span>
              <ResourceSelectField<NgsIndex>
                hideLabel={true}
                filter={filterBy(["name"])}
                name={`indexI5s[${rowLetter}]`}
                optionLabel={(primer) => primer.name}
                model={`seqdb-api/indexSet/${indexSet.id}/ngsIndexes`}
                styles={{ menu: () => ({ zIndex: 5 }) }}
              />
            </div>
          )
        );
      },
      header: () => "test2",
      accessorKey: "",
      enableResizing: false,
      enableSorting: false
    });

    for (
      let col = 0;
      col < (storageUnitType?.gridLayoutDefinition?.numberOfColumns ?? 0);
      col++
    ) {
      const columnLabel = String(col + 1);

      columns.push({
        cell: ({
          row: {
            original: { data }
          }
        }) => {
          const rowLabel = String.fromCharCode(data.row + 65);
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
        header: () => "test1",
        // header: () =>
        //   indexSet && (
        //     <>
        //       {columnLabel}
        //       <ResourceSelectField<NgsIndex>
        //         hideLabel={true}
        //         filter={filterBy(["name"])}
        //         name={`indexI7s[${columnLabel}]`}
        //         optionLabel={(primer) => primer.name}
        //         model={`seqdb-api/indexSet/${indexSet.id}/ngsIndexes`}
        //         styles={{ menu: () => ({ zIndex: 5 }) }}
        //       />
        //     </>
        //   ),
        id: `${columnLabel}`,
        accessorKey: `${columnLabel}`,
        enableResizing: false,
        enableSorting: false
      });
    }

    const tableData = new Array(
      storageUnitType?.gridLayoutDefinition?.numberOfRows ?? 0
    ).fill({});

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
        <ReactTable columns={columns} data={tableData} showPagination={false} />
      </DinaForm>
    );
  }

  return null;
}
