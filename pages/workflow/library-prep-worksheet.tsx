import { withRouter, WithRouterProps } from "next/router";
import { Head, LoadingSpinner, useQuery } from "../../components";
import { LibraryPrep, StepResource } from "../../types/seqdb-api";

export function LibraryPrepWorksheetPage({ router }: WithRouterProps) {
  const { stepResourceId } = router.query;

  const { loading: srLoading, response: srResponse } = useQuery<StepResource>({
    include:
      "libraryPrepBatch,libraryPrepBatch.protocol,libraryPrepBatch.thermocyclerProfile,libraryPrepBatch.indexSet,chain",
    path: `stepResource/${stepResourceId}`
  });

  const batch = srResponse && srResponse.data.libraryPrepBatch;

  const { loading: prepsLoading, response: prepsResponse } = useQuery<
    LibraryPrep[]
  >({
    fields: {
      indexPrimer: "name",
      sample: "name,version"
    },
    include: "indexI5,indexI7,sample",
    page: { limit: 1000 },
    path: `libraryPrepBatch/${batch ? batch.id : 0}/libraryPreps`,
    sort: "wellRow,wellColumn"
  });

  if (srLoading || prepsLoading) {
    return <LoadingSpinner loading={true} />;
  }

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
      <div className="container-fluid">
        <div className="form-group">
          <h2 className="d-inline">Library Prep Worksheet</h2>
          <button
            className="btn btn-primary d-print-none d-inline float-right"
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
              defaultValue={batch.protocol && batch.protocol.name}
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
                <div className="row form-group">
                  <div className="col-3">
                    <input className="form-control" />
                  </div>
                  <div className="col-9">
                    <strong>ul reaction mix pipetted into each tube</strong>
                  </div>
                </div>
                <HorizontalField
                  label="Thermocycler Profile"
                  defaultValue={batch.thermocyclerProfile.name}
                />
                <div className="row">
                  <div className="col-6">
                    {[...Array(6).keys()].map(i => (
                      <HorizontalField
                        label={`Step ${i + 1}`}
                        defaultValue={batch.thermocyclerProfile[`step${i + 1}`]}
                      />
                    ))}
                  </div>
                  <div className="col-6">
                    {[...Array(6).keys()].map(i => (
                      <HorizontalField
                        label={`Step ${i + 7}`}
                        defaultValue={batch.thermocyclerProfile[`step${i + 7}`]}
                      />
                    ))}
                  </div>
                </div>
                <HorizontalField
                  label="Cycles"
                  defaultValue={batch.thermocyclerProfile.cycles}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col-12">
            <BigField label="Results and next steps" />
          </div>
        </div>
        <LibraryPrepTable preps={prepsResponse.data} />
      </div>
    </div>
  );
}

function HorizontalField({ label, defaultValue = "" }) {
  return (
    <div className="row form-group">
      <strong className="col-3">{label}</strong>
      <div className="col-9">
        <input className="form-control" defaultValue={defaultValue} />
      </div>
    </div>
  );
}

function BigField({ label, defaultValue = "" }) {
  return (
    <div className="row form-group">
      <div className="col-12">
        <strong>{label}</strong>
        <textarea className="form-control" defaultValue={defaultValue} />
      </div>
    </div>
  );
}

interface LibraryPrepTableProps {
  preps: LibraryPrep[];
}

function LibraryPrepTable({ preps }: LibraryPrepTableProps) {
  return (
    <table className="table table-bordered table-sm">
      <thead>
        <tr>
          <th>Well Location</th>
          <th>Sample Name</th>
          <th>Sample Version</th>
          <th>Index i5</th>
          <th>Index i7</th>
        </tr>
      </thead>
      <tbody>
        {preps.map(prep => {
          const { wellColumn, wellRow } = prep;
          const wellLocation =
            !String(wellColumn) || !String(wellRow)
              ? null
              : `${wellRow}${String(wellColumn).padStart(2, "0")}`;

          return (
            <tr key={prep.id}>
              <td>{wellLocation}</td>
              <td>{prep.sample.name}</td>
              <td>{prep.sample.version}</td>
              <td>{prep.indexI5 && prep.indexI5.name}</td>
              <td>{prep.indexI7 && prep.indexI7.name}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export default withRouter(LibraryPrepWorksheetPage);
