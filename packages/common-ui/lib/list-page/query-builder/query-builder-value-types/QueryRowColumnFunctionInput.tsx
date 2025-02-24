import { compact } from "lodash";
import { useEffect, useMemo, useState } from "react";
import Select from "react-select";
import { useDinaIntl } from "../../../../../dina-ui/intl/dina-ui-intl";
import { ESIndexMapping } from "../../types";
import { QueryFieldSelector } from "../query-builder-core-components/QueryFieldSelector";

interface QueryRowColumnFunctionInputProps {
  /**
   * The function ID, which can be 'function1', function2, etc'
   */
  functionId: string;

  /**
   * Retrieve the current value from the Query Builder.
   */
  value?: string;

  /**
   * Pass the selected value to the Query Builder to store.
   */
  setValue?: (fieldPath: string) => void;

  /**
   * If being used in the column selector, operators and different styling is applied.
   */
  isInColumnSelector: boolean;

  /**
   * Index mapping containing all of the fields that should be displayed in the list.
   */
  indexMapping: ESIndexMapping[] | undefined;
}

export interface FormulaOption {
  label: string;
  value: FunctionNameType;
}

export type FunctionNameType = "CONCAT" | "CONVERT_COORDINATES_DD";

export interface ColumnFunctionSearchStates {
  // function name (formula), so far it only supports "CONCAT" and "CONVERT_COORDINATES_DD"
  functionName?: FunctionNameType;
  // column names for function CONCAT
  params?: (ESIndexMapping | undefined)[];
}

export default function QueryRowColumnFunctionInput({
  functionId,
  value,
  setValue,
  isInColumnSelector,
  indexMapping
}: QueryRowColumnFunctionInputProps) {
  const { formatMessage } = useDinaIntl();

  const formulaOptions: FormulaOption[] = [
    {
      label: formatMessage("CONCAT"),
      value: "CONCAT"
    },
    {
      label: formatMessage("CONVERT_COORDINATES_DD"),
      value: "CONVERT_COORDINATES_DD"
    }
  ];

  const [columnFunctionSearchState, setColumnFunctionSearchState] =
    useState<ColumnFunctionSearchStates>(() =>
      value
        ? JSON.parse(value)
        : {
            functionName: "",
            params: undefined
          }
    );

  const onFormulaChanged = (newFormula: FunctionNameType) => {
    if (columnFunctionSearchState.functionName !== newFormula) {
      setColumnFunctionSearchState({
        functionName: newFormula as any,
        params: newFormula === "CONCAT" ? [undefined] : undefined
      });
    }
  };

  // Convert the state in this component to a value that can be stored in the Query Builder.
  useEffect(() => {
    if (setValue && isValid(columnFunctionSearchState)) {
      setValue(JSON.stringify({ [functionId]: columnFunctionSearchState }));
    }
  }, [columnFunctionSearchState, setValue]);

  // Convert a value from Query Builder into the Field Extension State in this component.
  useEffect(() => {
    if (value) {
      setColumnFunctionSearchState(
        Object.values(JSON.parse(value))[0] as ColumnFunctionSearchStates
      );
    }
  }, [value]);

  const indexMappingFiltered = useMemo(() => {
    return (
      indexMapping?.filter(
        (item) => !item.dynamicField
        // TODO:  filter out columnFunction only like this item.dynamicField?.type !== "columnFunction",
        // but we need to handle the dynamic column input
      ) ?? []
    );
  }, indexMapping);

  const isValid = (state: ColumnFunctionSearchStates) => {
    if (state && state.functionName) {
      if (state.functionName === "CONCAT" && compact(state.params).length > 1) {
        return true;
      } else if (state.functionName === "CONVERT_COORDINATES_DD") {
        state.params = undefined;
        return true;
      }
    }
    return false;
  };

  const selectedFunction =
    formulaOptions?.find(
      (formula) => formula.value === columnFunctionSearchState.functionName
    ) ?? null;

  const functionParams = (
    compact(columnFunctionSearchState.params) as (ESIndexMapping | undefined)[]
  ).concat(undefined);

  const setFunctionParam = (fieldPath: string, index: number) => {
    const params = columnFunctionSearchState.params!;
    params[index] = indexMapping?.find((item) => item.value === fieldPath);
    setColumnFunctionSearchState({
      functionName: columnFunctionSearchState.functionName,
      params: [...params]
    });
  };

  return (
    <div className={isInColumnSelector ? "" : "row"}>
      {/* Formula Selector */}
      <label
        className={isInColumnSelector ? "ps-0 mt-2" : "col me-1 ms-2 ps-0"}
      >
        <strong>{formatMessage("selectFunctionToUse")}:</strong>
      </label>
      <Select<FormulaOption>
        className={isInColumnSelector ? "ps-0" : "col me-1 ms-2 ps-0"}
        onChange={(newValue: FormulaOption) => onFormulaChanged(newValue.value)}
        value={selectedFunction}
        options={formulaOptions}
      />
      {/* Field Selector */}
      {selectedFunction && selectedFunction.value === "CONCAT" ? (
        functionParams.map((field, index) => (
          <div key={index}>
            <label
              className={
                isInColumnSelector ? "ps-0 mt-2" : "col me-1 ms-2 ps-0"
              }
            >
              <strong>{formatMessage("selectFieldToUseWithFunction")}:</strong>
            </label>
            <QueryFieldSelector
              className={isInColumnSelector ? "ps-0" : "col me-1 ms-2 ps-0"}
              indexMap={indexMappingFiltered}
              currentField={field?.value}
              setField={(fieldPath) => setFunctionParam(fieldPath, index)}
              isInColumnSelector={true}
            />
          </div>
        ))
      ) : (
        <></>
      )}
    </div>
  );
}
