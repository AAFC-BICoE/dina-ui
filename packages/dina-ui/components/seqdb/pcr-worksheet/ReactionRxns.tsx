import { useState } from "react";
import { DinaMessage } from "../../../../dina-ui/intl/dina-ui-intl";
import {
  Protocol,
  ProtocolData,
  ProtocolDataUnitEnum
} from "../../../../dina-ui/types/collection-api";
import { convertNumber } from "../../workbook/utils/workbookMappingUtils";
import styles from "./ReactionRxns.module.css";

/**
 * JavaScript has an issue that 0.1 + 0.2 = 0.30000000000000004
 * This function is to make the number more accurate.
 * @param value
 * @returns
 */
function accurateNumber(value: number): number {
  return +value.toPrecision(12);
}

export function ReactionRxns({ protocol }: { protocol?: Protocol }) {
  const [numOfRxns, setNumOfRxns] = useState<number>();
  const ulRnxQuantities = [] as {
    key?: string;
    ulPerRxn: number | null;
    ul: number | null;
  }[];
  let totalUlRxn = 0;
  let totalUl = 0;
  let reactionMix: number | undefined;
  if (protocol?.protocolData) {
    for (const pd of protocol.protocolData) {
      populateReactionRxnsData(pd);
      populateTotalReactionMixVolume(pd);
    }
  }
  function populateTotalReactionMixVolume(pd: ProtocolData) {
    if (reactionMix === undefined && pd.key === "total_reaction_mix_volume") {
      const totalReactionMixVolumes = pd.protocolDataElement?.filter(
        (pde) =>
          pde.elementType === "quantity" && pde.unit === ProtocolDataUnitEnum.UL
      );
      if (totalReactionMixVolumes) {
        reactionMix = convertNumber(totalReactionMixVolumes[0]?.value) || 0;
      }
    }
  }

  function populateReactionRxnsData(pd: ProtocolData) {
    const ulRnxQuantityeElements = pd.protocolDataElement?.filter(
      (pde) =>
        pde.elementType === "quantity" &&
        pde.unit === ProtocolDataUnitEnum.UL_RXN
    );
    if (ulRnxQuantityeElements) {
      for (const el of ulRnxQuantityeElements) {
        const key =
          pd.key === "reverse_primer"
            ? "ITS4"
            : pd.key === "forward_primer"
            ? "ITS_1F"
            : pd.key;

        const ulPerRxn = convertNumber(el.value);
        const ul =
          numOfRxns == null || ulPerRxn == null
            ? null
            : accurateNumber(numOfRxns * ulPerRxn);
        ulRnxQuantities.push({ key, ulPerRxn, ul });
        totalUlRxn = accurateNumber(
          totalUlRxn + (ulPerRxn === null ? 0 : ulPerRxn)
        );
        totalUl = accurateNumber(totalUl + (ul === null ? 0 : ul));
      }
    }
  }

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
              value={reactionMix}
            />
          </div>
          <div>
            <label>
              <strong># Rxns = </strong>
            </label>
            <input
              type="number"
              className="form-control bg-warning"
              value={numOfRxns}
              onChange={(e) => setNumOfRxns(convertNumber(e.target.value) || 0)}
            />
          </div>
        </div>
      </div>
      <div className="row">
        <div className="col-sm-12 text-end mb-3">
          <span className={styles.rxnsFormular + " bg-warning"}>
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
              {ulRnxQuantities && ulRnxQuantities.length > 0 ? (
                ulRnxQuantities.map((item, index) => (
                  <tr key={`${item.key}-${index}`}>
                    <td>{item.key}</td>
                    <td />
                    <td>{item.ulPerRxn}</td>
                    <td>{item.ul}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4}>
                    <DinaMessage id="noUlRnxProtocolData" />
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr>
                <th>Total</th>
                <th />
                <th>{totalUlRxn}</th>
                <th>{totalUl}</th>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </>
  );
}
