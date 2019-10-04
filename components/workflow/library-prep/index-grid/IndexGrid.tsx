import { Form, Formik } from "formik";
import ReactTable, { Column } from "react-table";
import {
  ErrorViewer,
  LoadingSpinner,
  ResourceSelectField,
  SubmitButton,
  useCacheableQueryLoader
} from "../../..";
import {
  LibraryPrep,
  LibraryPrepBatch,
  PcrPrimer
} from "../../../../types/seqdb-api";
import { filterBy } from "../../../../util/rsql";
import { useIndexGridControls } from "./useIndexGridControls";

export interface IndexGridProps {
  libraryPrepBatch: LibraryPrepBatch;
}

export function IndexGrid(props: IndexGridProps) {
  const { libraryPrepBatch } = props;

  const { containerType } = libraryPrepBatch;
  const resourceSelectLoader = useCacheableQueryLoader();

  const {
    libraryPrepsLoading,
    libraryPrepsResponse,
    onSubmit
  } = useIndexGridControls(props);

  if (libraryPrepsLoading) {
    return <LoadingSpinner loading={true} />;
  }

  if (libraryPrepsResponse) {
    const libraryPreps = libraryPrepsResponse.data;

    const libraryPrepsWithCoords = libraryPreps.filter(
      prep => prep.wellRow && prep.wellColumn
    );

    const cellGrid: { [key: string]: LibraryPrep } = {};
    for (const prep of libraryPrepsWithCoords) {
      cellGrid[`${prep.wellRow}_${prep.wellColumn}`] = prep;
    }

    const columns: Column[] = [];

    // Add the primer column:
    columns.push({
      Cell: ({ index }) => {
        const rowLetter = String.fromCharCode(index + 65);

        return (
          <div style={{ padding: "7px 5px" }}>
            <span>{String.fromCharCode(index + 65)}</span>
            <ResourceSelectField<PcrPrimer>
              // TODO: this should fetch the index set primers.
              customDataFetch={resourceSelectLoader}
              hideLabel={true}
              filter={filterBy(["name"])}
              name={`indexI7s[${rowLetter}]`}
              optionLabel={primer => primer.name}
              model="pcrPrimer"
              styles={{ menu: () => ({ zIndex: 5 }) }}
            />
          </div>
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
              <div>{prep.sample.name}</div>
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
        Header: () => (
          <>
            {columnLabel}
            <ResourceSelectField<PcrPrimer>
              // TODO: this should fetch the index set primers.
              customDataFetch={resourceSelectLoader}
              hideLabel={true}
              filter={filterBy(["name"])}
              name={`indexI5s[${columnLabel}]`}
              optionLabel={primer => primer.name}
              model="pcrPrimer"
              styles={{ menu: () => ({ zIndex: 5 }) }}
            />
          </>
        ),
        resizable: false,
        sortable: false
      });
    }

    const tableData = new Array(containerType.numberOfRows).fill({});

    return (
      <Formik
        initialValues={{ indexI5s: {}, indexI7s: {} }}
        onSubmit={onSubmit}
      >
        <Form>
          <ErrorViewer />
          <style>{`
            .rt-td {
              padding: 0 !important;
            }
          `}</style>
          <ReactTable
            columns={columns}
            data={tableData}
            minRows={0}
            showPagination={false}
          />
          <div className="float-right">
            <SubmitButton />
          </div>
        </Form>
      </Formik>
    );
  }
}
