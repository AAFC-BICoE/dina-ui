import { compact } from "lodash";
import { useEffect, useMemo, useState } from "react";
import Select from "react-select";
import { useDinaIntl } from "../../../../../dina-ui/intl/dina-ui-intl";
import { ESIndexMapping } from "../../types";
import { QueryFieldSelector } from "../query-builder-core-components/QueryFieldSelector";
import QueryRowClassificationSearch from "./QueryBuilderClassificationSearch";
import QueryRowFieldExtensionSearch from "./QueryBuilderFieldExtensionSearch";
import QueryRowIdentifierSearch from "./QueryBuilderIdentifierSearch";
import QueryRowManagedAttributeSearch from "./QueryBuilderManagedAttributeSearch";
import QueryRowRelationshipPresenceSearch from "./QueryBuilderRelationshipPresenceSearch";

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
  indexMapping: ESIndexMapping[];
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
    useState<ColumnFunctionSearchStates>(
      value
        ? JSON.parse(value)
        : {
            functionName: undefined,
            params: undefined
          }
    );

  const [
    submittedColumnFunctionSearchState,
    setSubmittedColumnFunctionSearchState
  ] = useState<ColumnFunctionSearchStates>(
    value
      ? JSON.parse(value)
      : {
          functionName: undefined,
          params: undefined
        }
  );

  const onFormulaChanged = (newFormula: FunctionNameType) => {
    if (columnFunctionSearchState.functionName !== newFormula) {
      setColumnFunctionSearchState({
        functionName: newFormula as any,
        params: newFormula === "CONCAT" ? [undefined] : undefined
      });
      setSubmittedColumnFunctionSearchState({
        functionName: newFormula as any,
        params: newFormula === "CONCAT" ? [undefined] : undefined
      });
    }
  };

  // Convert the state in this component to a value that can be stored in the Query Builder.
  useEffect(() => {
    if (setValue && isValid(submittedColumnFunctionSearchState)) {
      setValue(
        JSON.stringify({
          [functionId]: submittedColumnFunctionSearchState
        })
      );
    }
  }, [submittedColumnFunctionSearchState, setValue]);

  const indexMappingFiltered = useMemo(() => {
    return (
      indexMapping?.filter(
        (item) => item.dynamicField?.type !== "columnFunction"
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
    const params = columnFunctionSearchState.params ?? [];
    params[index] = indexMapping?.find((item) => item.value === fieldPath);

    const submittedParams = submittedColumnFunctionSearchState.params ?? [];
    submittedParams[index] = indexMapping?.find(
      (item) => item.value === fieldPath
    );

    setColumnFunctionSearchState({
      functionName: columnFunctionSearchState.functionName,
      params: [...params]
    });
    setSubmittedColumnFunctionSearchState({
      functionName: submittedColumnFunctionSearchState.functionName,
      params: [...submittedParams]
    });
  };

  const onColumnItemSelected = (columnPath: string, index: number) => {
    setFunctionParam(columnPath, index);
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
        functionParams.map((field, index) => {
          return (
            <div key={index}>
              <label
                className={
                  isInColumnSelector ? "ps-0 mt-2" : "col me-1 ms-2 ps-0"
                }
              >
                <strong>
                  {formatMessage("selectFieldToUseWithFunction")}:
                </strong>
              </label>
              <QueryFieldSelector
                className={isInColumnSelector ? "ps-0" : "col me-1 ms-2 ps-0"}
                indexMap={indexMappingFiltered}
                currentField={field?.value}
                setField={(fieldPath) => onColumnItemSelected(fieldPath, index)}
                isInColumnSelector={true}
              />
              {field?.dynamicField?.type === "managedAttribute" && (
                <QueryRowManagedAttributeSearch
                  indexMap={indexMapping}
                  managedAttributeConfig={field}
                  isInColumnSelector={true}
                  setValue={onDynamicFieldSearchChange(field, index)}
                />
              )}
              {field?.dynamicField?.type === "fieldExtension" && (
                <QueryRowFieldExtensionSearch
                  fieldExtensionConfig={field}
                  setValue={onDynamicFieldSearchChange(field, index)}
                  isInColumnSelector={true}
                />
              )}
              {field?.dynamicField?.type === "identifier" && (
                <QueryRowIdentifierSearch
                  indexMap={indexMapping}
                  identifierConfig={field}
                  isInColumnSelector={true}
                  setValue={onDynamicFieldSearchChange(field, index)}
                />
              )}
              {field?.dynamicField?.type === "relationshipPresence" && (
                <QueryRowRelationshipPresenceSearch
                  setValue={onDynamicFieldSearchChange(field, index)}
                  indexMapping={indexMapping!}
                  isInColumnSelector={true}
                />
              )}
              {field?.dynamicField?.type === "classification" && (
                <QueryRowClassificationSearch
                  setValue={onDynamicFieldSearchChange(field, index)}
                  isInColumnSelector={true}
                />
              )}
            </div>
          );
        })
      ) : (
        <></>
      )}
    </div>
  );

  function onDynamicFieldSearchChange(
    field: ESIndexMapping,
    index: number
  ): ((fieldPath: string) => void) | undefined {
    return (fieldPath) => {
      if (field?.dynamicField) {
        const params = [...(submittedColumnFunctionSearchState.params ?? [])];
        let indexValue: string;
        let foundIndexMapping: ESIndexMapping | undefined = undefined;
        switch (field.dynamicField.type) {
          case "managedAttribute":
            indexValue = `${
              JSON.parse(fieldPath)?.selectedManagedAttributeConfig?.value
            }`;
            break;
          case "fieldExtension":
            indexValue = `${field.path}.${
              JSON.parse(fieldPath)?.selectedExtension
            }.${JSON.parse(fieldPath)?.selectedField}`;
            break;
          case "classification":
            indexValue = `${field.path}.${
              JSON.parse(fieldPath)?.selectedClassificationRank
            }`;

            break;
          default:
            break;
        }
        foundIndexMapping = indexMapping?.find((item) => {
          return item.value === indexValue;
        });
        if (
          foundIndexMapping &&
          JSON.stringify(foundIndexMapping) !== JSON.stringify(params.at(index))
        ) {
          params[index] = foundIndexMapping;
          // Update dynamicField for submitted column function search state only to prevent unwanted dropdown changes
          setSubmittedColumnFunctionSearchState((prev) => ({
            ...prev,
            params: params
          }));
        }
      }
    };
  }
}
