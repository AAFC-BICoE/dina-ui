export function ReactionInputs() {
  return (
    <>
      <div className="row">
        <div className="col-sm-2 mb-2">
          <input
            type="text"
            className="form-control"
            disabled={true}
            value={9}
          />
        </div>
        <label className="col-sm-10 mb-2">
          <strong>ul reaction mix pipetted into each PCR tube</strong>
        </label>
      </div>
      <div className="row">
        <div className="col-sm-2 mb-2">
          <input
            type="text"
            className="form-control"
            disabled={true}
            value={1}
          />
        </div>
        <label className="col-sm-10 mb-2">
          <strong>ul of T-DNA added to each specific tube</strong>
        </label>
      </div>
      <div className="row">
        <div className="col-sm-2 mb-2">
          <input
            type="text"
            className="form-control"
            disabled={true}
            value={1}
          />
        </div>
        <label className="col-sm-10 mb-2">
          <strong>ul positive control added to +ve control tube</strong>
        </label>
      </div>
      <div className="row">
        <div className="col-sm-2 mb-2">
          <input
            type="text"
            className="form-control"
            disabled={true}
            value={1}
          />
        </div>
        <label className="col-sm-10 mb-2">
          <strong>ul negative control added to -ve control tube</strong>
        </label>
      </div>
    </>
  );
}
