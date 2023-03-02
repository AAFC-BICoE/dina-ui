import { DinaMessage } from "packages/dina-ui/intl/dina-ui-intl";
import styles from "./ReactionRxns.module.css";

export function ReactionRxns() {
  return (
    <>
      <div className="row">
        <div className={styles.fieldGroup + " col-sm-12 mb-3"}>
          <div>
            <label>
              <strong>Reaction mix (ul)</strong>
            </label>
            <input
              type="text"
              className="form-control"
              disabled={true}
              value={10}
            />
          </div>
          <div>
            <label>
              <strong># Rxns = </strong>
            </label>
            <input
              type="text"
              className="form-control"
              value={2}
              style={{ backgroundColor: "yellow" }}
            />
          </div>
        </div>
      </div>
      <div className="row">
        <div className="col-sm-12 text-end mb-3">
          <span className={styles.rxnsFormular}>
            <strong>
              <DinaMessage id="rxnsFormular" />
            </strong>
          </span>
        </div>
      </div>
      <div className="row">
        <div className="col-sm-12 mb-3">
          <table className="table table-striped table-bordered">
            <thead>
              <tr>
                <th />
                <th>Lot #</th>
                <th>µl/rxn</th>
                <th>µl</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>ITS4</td>
                <td />
                <td>0.04</td>
                <td />
              </tr>
              <tr>
                <td>ITS_1F</td>
                <td />
                <td>0.04</td>
                <td />
              </tr>
              <tr>
                <td>(10X)Tit Buffer</td>
                <td />
                <td>1</td>
                <td />
              </tr>
              <tr>
                <td>2mM dNTPs</td>
                <td />
                <td>0.5</td>
                <td />
              </tr>
              <tr>
                <td>(50X) Titanium Taq</td>
                <td />
                <td>0.1</td>
                <td />
              </tr>
              <tr>
                <td>BSA 20mg/ml</td>
                <td />
                <td>0.5</td>
                <td />
              </tr>
              <tr>
                <td>Sterile HPLC Water H20</td>
                <td />
                <td>6.82</td>
                <td />
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <th>Total</th>
                <th />
                <th>9</th>
                <th />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </>
  );
}
