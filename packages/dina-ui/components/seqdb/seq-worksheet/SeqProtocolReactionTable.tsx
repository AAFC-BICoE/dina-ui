import { useState, useMemo, useEffect, useRef } from "react";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import {
  Protocol,
  ProtocolData,
  ProtocolDataUnitEnum
} from "../../../types/collection-api";
import { convertNumber } from "../../workbook/utils/workbookMappingUtils";
import styles from "./SeqProtocolReactionTable.module.css";
import { SeqReaction } from "packages/dina-ui/types/seqdb-api";
import classNames from "classnames";
import useVocabularyOptions from "../../collection/useVocabularyOptions";
import { ErrorBanner } from "../../error/ErrorBanner";

/**
 * JavaScript has an issue that 0.1 + 0.2 = 0.30000000000000004
 * This function is to make the number more accurate.
 * @param value
 * @returns
 */
function accurateNumber(value: number): number {
  return +value.toPrecision(12);
}

export function SeqProtocolReactionTable({
  protocol,
  seqReactions
}: {
  protocol?: Protocol;
  seqReactions?: SeqReaction[];
}) {
  const { formatMessage } = useDinaIntl();
  const unitMismatchComponents = useRef<string[]>([]);
  const { vocabOptions: unitsOfMeasurement } = useVocabularyOptions({
    path: "collection-api/vocabulary2/unitsOfMeasurement"
  });

  const { vocabOptions: protocolData } = useVocabularyOptions({
    path: "collection-api/vocabulary2/protocolData"
  });

  const primerRxnsNumber = useMemo<{
    [key: string]: number;
  }>(
    () =>
      seqReactions?.reduce((prev, curr) => {
        const primerName = curr.seqPrimer?.name;
        if (!!primerName) {
          if (!prev[primerName]) {
            prev[primerName] = 1;
          } else {
            prev[primerName] += 1;
          }
        }
        return prev;
      }, {} as { [key: string]: number }) || {},
    [seqReactions]
  );

  const [numbersOfRxns, setNumbersOfRxns] = useState<number[]>(
    Object.values(primerRxnsNumber)
  );

  useEffect(() => {
    setNumbersOfRxns(Object.values(primerRxnsNumber));
  }, [primerRxnsNumber]);

  const onInputChange = (index: number, val: number) => {
    numbersOfRxns[index] = val;
    setNumbersOfRxns([...numbersOfRxns]);
  };

  const ulRnxQuantities: {
    component?: string;
    concentration: string | null;
    ulRxn: number | null;
  }[] = populateReactionRxnsData(protocol?.protocolData);

  function findUnitLabel(value: string | null | undefined) {
    if (!value) {
      return "";
    } else {
      return (
        unitsOfMeasurement.find((option) => option.value === value)?.label ??
        value
      );
    }
  }

  function findProtocolLabel(value: string | null | undefined) {
    if (!value) {
      return "";
    } else {
      return (
        protocolData.find((option) => option.value === value)?.label ?? value
      );
    }
  }

  function populateReactionRxnsData(pdArray?: ProtocolData[]) {
    const result: {
      component?: string;
      concentration: string | null;
      ulRxn: number | null;
    }[] = [];
    const unitMismatches: string[] = [];
    for (const pd of pdArray ?? []) {
      const ulRxn = convertNumber(
        pd.protocolDataElement?.find((pde) => {
          if (
            pde.elementType === "quantity" &&
            pde.unit === ProtocolDataUnitEnum.UL_RXN
          ) {
            return true;
          } else {
            unitMismatches.push(findProtocolLabel(pd.key));
            return false;
          }
        })?.value ?? ""
      );

      const concentrationElement = pd.protocolDataElement?.find(
        (pde) => pde.elementType === "concentration"
      );
      const concentration =
        (concentrationElement?.value ?? "") +
        " " +
        (findUnitLabel(concentrationElement?.unit) ?? "");
      result.push({
        component: findProtocolLabel(pd.key),
        concentration,
        ulRxn
      });
    }
    unitMismatchComponents.current = unitMismatches;
    return result;
  }

  return (
    <>
      {unitMismatchComponents.current.length > 0 && (
        <ErrorBanner
          errorMessage={formatMessage("unitMismatchComponents", {
            components: unitMismatchComponents.current.join(", ")
          })}
        />
      )}
      <table className={classNames("mb-3", styles.primer)}>
        <tbody>
          <tr>
            <th colSpan={3} className="text-end">
              <b>
                <DinaMessage id="seqWorksheetPrimer" />
              </b>
            </th>
            {Object.keys(primerRxnsNumber).map((primerName, index) => (
              <td key={index}>{primerName}</td>
            ))}
          </tr>
          <tr>
            <th colSpan={3} className="text-end">
              <b>
                <DinaMessage id="seqWorksheetRxns" />
                <mark className="bg-warning">
                  <DinaMessage id="seqWorkSheetPleaseAdd" />
                  <i>x</i>
                  <DinaMessage id="seqWorkSheetErrors" /> =
                </mark>
              </b>
            </th>
            {numbersOfRxns.map((val, index) => (
              <td key={index}>
                <input
                  type="number"
                  className="form-control bg-warning"
                  value={val}
                  onChange={(e) =>
                    onInputChange(index, convertNumber(e.target.value) || 0)
                  }
                />
              </td>
            ))}
          </tr>
          <tr>
            <th className="text-center">
              <b>
                <DinaMessage id="seqWorksheetComponents" />
              </b>
            </th>
            <th className="text-center">
              <b>
                <DinaMessage id="seqWorksheetConcentration" />
              </b>
            </th>
            <th className="text-center">
              <b>
                <DinaMessage id="seqWorksheetUlRxn" />
              </b>
            </th>
          </tr>
          {ulRnxQuantities.map((item, index) => (
            <tr key={index}>
              <td>{item.component}</td>
              <td>{item.concentration}</td>
              <td>{item.ulRxn}</td>
              {numbersOfRxns.map((val, index2) => (
                <td key={index2}>
                  {item.ulRxn === null ? "" : accurateNumber(item.ulRxn * val)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td>
              <DinaMessage id="total" />
            </td>
            <td />
            <td />
            {numbersOfRxns.map((val, index) => {
              const total = ulRnxQuantities.reduce(
                (accu, cur) => accu + (cur.ulRxn ?? 0),
                0
              );
              return <td key={index}>{accurateNumber(total * val)}</td>;
            })}
          </tr>
        </tfoot>
      </table>
    </>
  );
}
