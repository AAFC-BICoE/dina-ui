import { Formik } from "formik";
import { Dictionary, toPairs } from "lodash";
import ReactTable, { Column } from "react-table";
import {
  LoadingSpinner,
  ResourceSelectField,
  useCacheableQueryLoader,
  useQuery
} from "../..";
import {
  LibraryPrep,
  LibraryPrepBatch,
  PcrPrimer
} from "../../../types/seqdb-api";
import { filterBy } from "../../../util/rsql";

interface LibraryPrepGridProps {
  libraryPrepBatch: LibraryPrepBatch;
}

export function IndexGrid({ libraryPrepBatch }: LibraryPrepGridProps) {
  const { containerType } = libraryPrepBatch;
  const resourceSelectLoader = useCacheableQueryLoader();

  const {
    loading: libraryPrepsLoading,
    response: libraryPrepsResponse
  } = useQuery<LibraryPrep[]>({
    fields: {
      pcrPrimer: "name",
      sample: "name"
    },
    include: "sample,indexI5,indexI7",
    page: { limit: 1000 },
    path: `libraryPrepBatch/${libraryPrepBatch.id}/libraryPreps`
  });

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

    const pairs = toPairs(cellGrid);
    const indexI5s: Dictionary<PcrPrimer> = {};
    const indexI7s: Dictionary<PcrPrimer> = {};
    for (const [coords, prep] of pairs) {
      const [row, col] = coords.split("_");
      if (prep.indexI5) {
        indexI5s[col] = prep.indexI5;
      }
      if (prep.indexI7) {
        indexI7s[row] = prep.indexI7;
      }
    }

    const columns: Column[] = [];

    // Add the primer column:
    columns.push({
      Cell: ({ index }) => {
        const rowLetter = String.fromCharCode(index + 65);

        return (
          <div style={{ padding: "7px 5px" }}>
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
            <div className="h-100 w-100">
              <div className="list-group-item">{prep.sample.name}</div>
            </div>
          ) : null;
        },
        Header: () => {
          return (
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
          );
        },
        resizable: false,
        sortable: false
      });
    }

    const tableData = new Array(containerType.numberOfRows).fill({});

    function onSubmit() {
      // const { indexI5s, indexI7s } = values;
    }

    return (
      <Formik initialValues={{ indexI5s, indexI7s }} onSubmit={onSubmit}>
        <>
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
        </>
      </Formik>
    );
  }
}
