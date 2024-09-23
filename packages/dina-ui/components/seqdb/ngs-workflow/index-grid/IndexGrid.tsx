import {
  ErrorViewer,
  filterBy,
  LoadingSpinner,
  ResourceSelectField,
  SubmitButton
} from "common-ui";
import { Form, Formik } from "formik";
import ReactTable, { Column } from "react-table";
import {
  LibraryPrep,
  LibraryPrepBatch,
  NgsIndex
} from "../../../../types/seqdb-api";
import { useIndexGridControls } from "./useIndexGridControls";

export interface IndexGridProps {
  libraryPrepBatch: LibraryPrepBatch;
}

export function IndexGrid(props: IndexGridProps) {
  const { libraryPrepBatch } = props;

  const { storageUnit, indexSet } = libraryPrepBatch;

  const { libraryPrepsLoading, libraryPrepsResponse, onSubmit } =
    useIndexGridControls(props);

  if (libraryPrepsLoading) {
    return <LoadingSpinner loading={true} />;
  }

  if (
    !libraryPrepsResponse?.data?.storageUnitUsage?.storageUnitType ||
    !indexSet
  ) {
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

    const columns: Column[] = [];

    // Add the primer column:
    columns.push({
      Cell: ({ index }) => {
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
                model={`seqdb-api/indexSet/${libraryPrepBatch.indexSet.id}/ngsIndexes`}
                styles={{ menu: () => ({ zIndex: 5 }) }}
              />
            </div>
          )
        );
      },
      resizable: false,
      sortable: false
    });

    for (let col = 0; col < containerType.numberOfColumns; col++) {
      const columnLabel = String(col + 1);

      columns.push({
        Cell: ({ index: row }) => {
          const rowLabel = String.fromCharCode(row + 65);
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
        Header: () =>
          libraryPrepBatch.indexSet && (
            <>
              {columnLabel}
              <ResourceSelectField<NgsIndex>
                hideLabel={true}
                filter={filterBy(["name"])}
                name={`indexI7s[${columnLabel}]`}
                optionLabel={(primer) => primer.name}
                model={`seqdb-api/indexSet/${libraryPrepBatch.indexSet.id}/ngsIndexes`}
                styles={{ menu: () => ({ zIndex: 5 }) }}
              />
            </>
          ),
        resizable: false,
        sortable: false
      });
    }

    const tableData = new Array(storageUnit.numberOfRows).fill({});

    return (
      <Formik
        initialValues={{ indexI5s: {}, indexI7s: {} }}
        onSubmit={onSubmit}
      >
        <Form translate={undefined}>
          <style>{`
            .rt-td {
              padding: 0 !important;
            }
          `}</style>
          <ErrorViewer />
          <div style={{ height: "50px" }}>
            <div className="float-right">
              <SubmitButton />
            </div>
          </div>
          <ReactTable
            columns={columns}
            data={tableData}
            minRows={0}
            showPagination={false}
          />
        </Form>
      </Formik>
    );
  }

  return null;
}
