import { LoadingSpinner, useQuery } from "common-ui";
import { useRouter } from "next/router";
import { Head } from "../../../components";
import {
  LibraryPrep,
  LibraryPrepBatch,
  StepResource
} from "../../../types/seqdb-api";

export default function LibraryPrepWorksheetPage() {
  const {
    query: { stepResourceId, sampleLayout }
  } = useRouter();

  const { loading: srLoading, response: srResponse } = useQuery<StepResource>({
    include: [
      "libraryPrepBatch",
      "libraryPrepBatch.protocol",
      "libraryPrepBatch.thermocyclerProfile",
      "libraryPrepBatch.indexSet",
      "libraryPrepBatch.containerType",
      "chain"
    ].join(","),
    path: `seqdb-api/step-resource/${stepResourceId}`
  });

  const batch = srResponse && srResponse.data.libraryPrepBatch;

  const { loading: prepsLoading, response: prepsResponse } = useQuery<
    LibraryPrep[]
  >({
    fields: {
      "ngs-index": "name",
      "molecular-sample": "name"
    },
    include: "indexI5,indexI7,molecularSample",
    page: { limit: 1000 },
    path: `seqdb-api/library-prep-batch/${batch ? batch.id : 0}/libraryPreps`,
    sort: "wellRow,wellColumn"
  });

  if (srLoading || prepsLoading) {
    return <LoadingSpinner loading={true} />;
  }

  if (srResponse && batch) {
    const chain = srResponse.data.chain;

    return (
      <div style={{ width: "1100px" }}>
        <Head title="Library Prep Worksheet" />
        <style>{`
          @media print {
            body {
              padding: 0;
            }
            a[href]:after {
              content: none !important;
            }
          }
          
          @media print and (-webkit-min-device-pixel-ratio:0) and (min-resolution: .001dpcm) {
            body {
              padding-left: 1.5cm;
            }
            a[href]:after {
              content: none !important;
            }
          }
        `}</style>
        <main className="container-fluid">
          <div className="mb-3">
            <h2 className="d-inline">Library Prep Worksheet</h2>
            <button
              className="btn btn-primary d-print-none d-inline float-end"
              onClick={() => window.print()}
            >
              Print
            </button>
          </div>
          <div className="row">
            <div className="col-6">
              <HorizontalField label="Workflow" defaultValue={chain.name} />
              <HorizontalField
                label="Protocol"
                defaultValue={batch.protocol ? batch.protocol.id : ""}
              />
            </div>
            <div className="col-6">
              <HorizontalField label="Experimenter" />
              <HorizontalField label="Date" />
            </div>
          </div>
          <div style={{ height: "50px" }} />
          <div className="row">
            <div className="col-6">
              <BigField label="Notes" />
              <HorizontalField label="Thermocycler" />
            </div>
            <div className="col-6">
              <div className="row">
                <div className="col-12">
                  <HorizontalField label="Pos Control" />
                  <HorizontalField label="Neg Control" />
                  <div className="row mb-3">
                    <div className="col-3">
                      <input className="form-control" />
                    </div>
                    <div className="col-9">
                      <strong>ul reaction mix pipetted into each tube</strong>
                    </div>
                  </div>
                  <HorizontalField
                    label="Thermocycler Profile"
                    defaultValue={
                      batch.thermocyclerProfile
                        ? batch.thermocyclerProfile.name
                        : ""
                    }
                  />
                  <div className="row">
                    <div className="col-6">
                      {[...Array(6).keys()].map(i => (
                        <HorizontalField
                          key={i}
                          label={`Step ${i + 1}`}
                          defaultValue={
                            batch.thermocyclerProfile &&
                            batch.thermocyclerProfile[`step${i + 1}`]
                          }
                        />
                      ))}
                    </div>
                    <div className="col-6">
                      {[...Array(6).keys()].map(i => (
                        <HorizontalField
                          key={i}
                          label={`Step ${i + 7}`}
                          defaultValue={
                            batch.thermocyclerProfile &&
                            batch.thermocyclerProfile[`step${i + 7}`]
                          }
                        />
                      ))}
                    </div>
                  </div>
                  <HorizontalField
                    label="Cycles"
                    defaultValue={
                      batch.thermocyclerProfile &&
                      batch.thermocyclerProfile.cycles
                        ? batch.thermocyclerProfile.cycles
                        : ""
                    }
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="row">
            <div className="col-12">
              <BigField label="Results and next steps" />
              {prepsResponse && (
                <>
                  {sampleLayout === "table" ? (
                    <LibraryPrepTable
                      libraryPrepBatch={batch}
                      preps={prepsResponse.data}
                    />
                  ) : sampleLayout === "grid" ? (
                    <LibraryPrepGrid
                      libraryPrepBatch={batch}
                      preps={prepsResponse.data}
                    />
                  ) : null}
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return null;
}

function HorizontalField({ label, defaultValue = "" }) {
  return (
    <div className="row mb-3">
      <strong className="col-3">{label}</strong>
      <div className="col-9">
        <input className="form-control" defaultValue={defaultValue} />
      </div>
    </div>
  );
}

function BigField({ label, defaultValue = "" }) {
  return (
    <div className="row mb-3">
      <div className="col-12">
        <strong>{label}</strong>
        <textarea className="form-control" defaultValue={defaultValue} />
      </div>
    </div>
  );
}

interface LibraryPrepTableProps {
  libraryPrepBatch: LibraryPrepBatch;
  preps: LibraryPrep[];
}

function LibraryPrepTable({ preps }: LibraryPrepTableProps) {
  return (
    <table className="table table-bordered table-sm library-prep-table">
      <thead>
        <tr>
          <th>Well Location</th>
          <th>Sample Name</th>
          <th>Index i5</th>
          <th>Index i7</th>
        </tr>
      </thead>
      <tbody>
        {preps.map(prep => {
          const { wellColumn, wellRow } = prep;
          const wellLocation =
            wellColumn === null || !wellRow
              ? null
              : `${wellRow}${String(wellColumn).padStart(2, "0")}`;

          return (
            <tr key={String(prep.id)}>
              <td>{wellLocation}</td>
              <td>{prep.molecularSample.name}</td>
              <td>{prep.indexI5 && prep.indexI5.name}</td>
              <td>{prep.indexI7 && prep.indexI7.name}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function LibraryPrepGrid({ libraryPrepBatch, preps }: LibraryPrepTableProps) {
  const { containerType } = libraryPrepBatch;

  if (!containerType) {
    return null;
  }

  const cellGrid: { [key: string]: LibraryPrep } = {};

  const libraryPrepsWithCoords = preps.filter(
    prep => prep.wellRow && prep.wellColumn
  );
  for (const prep of libraryPrepsWithCoords) {
    cellGrid[`${prep.wellRow}_${prep.wellColumn}`] = prep;
  }

  const { numberOfColumns, numberOfRows } = containerType;

  const rowLetters = [...Array(numberOfRows).keys()].map(num =>
    String.fromCharCode(num + 65)
  );
  const columnNumbers = [...Array(numberOfColumns).keys()].map(num => num + 1);

  return (
    <table className="table table-bordered table-sm library-prep-grid">
      <tbody>
        <tr>
          <td />
          {columnNumbers.map(num => (
            <td key={num}>{num}</td>
          ))}
        </tr>
        {rowLetters.map(rowLetter => (
          <tr key={rowLetter}>
            <td>{rowLetter}</td>
            {columnNumbers.map(columnNumber => {
              const prep = cellGrid[`${rowLetter}_${columnNumber}`];

              return (
                <td key={columnNumber}>
                  {prep && (
                    <div className="h-100 w-100">
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
                  )}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
