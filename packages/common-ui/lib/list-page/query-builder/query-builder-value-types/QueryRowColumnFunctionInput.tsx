import _ from "lodash";
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
import {
  FunctionDef,
  FunctionDefinitions
} from "../../../../../dina-ui/types/dina-export-api";

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
  value: FunctionDefinitions;
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

  // Helper to safely parse initial state
  const parseInitialState = (val?: string): FunctionDef => {
    if (!val) return { functionDef: undefined as any, params: {} };
    try {
      const parsed = JSON.parse(val);
      // Handle the wrapper object { [functionId]: ... } if it exists, or raw object
      const innerObj = parsed[functionId] || Object.values(parsed)[0];
      return innerObj || { functionDef: undefined as any, params: {} };
    } catch (_e) {
      return { functionDef: undefined as any, params: {} };
    }
  };

  const [columnFunctionSearchState, setColumnFunctionSearchState] =
    useState<FunctionDef>(parseInitialState(value));

  const [
    submittedColumnFunctionSearchState,
    setSubmittedColumnFunctionSearchState
  ] = useState<FunctionDef>(parseInitialState(value));

  const onFormulaChanged = (newFormula: FunctionDefinitions) => {
    if (columnFunctionSearchState.functionDef !== newFormula) {
      setColumnFunctionSearchState({
        functionDef: newFormula as any,
        params: newFormula === "CONCAT" ? { items: [] } : {}
      });
      setSubmittedColumnFunctionSearchState({
        functionDef: newFormula as any,
        params: newFormula === "CONCAT" ? { items: [] } : {}
      });
    }
  };

  // Convert the state in this component to a value that can be stored in the Query Builder.
  useEffect(() => {
    if (setValue && isValid(submittedColumnFunctionSearchState)) {
      const payload: FunctionDef = _.cloneDeep(
        submittedColumnFunctionSearchState
      );

      // Convert Objects back to Strings for the output
      if (
        payload.functionDef === "CONCAT" &&
        payload.params?.items &&
        Array.isArray(payload.params.items)
      ) {
        payload.params.items = payload.params.items.map((field: any) => {
          // If it's already a string, keep it. If it's a mapping object, transform it.
          if (typeof field === "string") return field;
          return field?.parentName ? field.value : field?.label;
        });
      }

      setValue(
        JSON.stringify({
          [functionId]: payload
        })
      );
    }
  }, [submittedColumnFunctionSearchState, setValue, functionId]);

  // Convert a value from Query Builder into the Field Extension State in this component.
  useEffect(() => {
    if (value && indexMapping) {
      const rawParsed = Object.values(JSON.parse(value))[0] as FunctionDef;

      // Convert Strings back to Objects so the Dropdowns work properly.
      if (
        rawParsed.functionDef === "CONCAT" &&
        rawParsed.params?.items &&
        Array.isArray(rawParsed.params.items)
      ) {
        rawParsed.params.items = rawParsed.params.items.map((item: any) => {
          // If it is already an object (ESIndexMapping), leave it alone
          if (typeof item !== "string") return item;

          // Find the matching ESIndexMapping object from the provided indexMapping list
          // We check against 'value' (path) OR 'label' because the save logic uses either depending on parentName
          const found = indexMapping.find(
            (mapping) => mapping.value === item || mapping.label === item
          );

          return found || { label: item, value: item };
        });
      }

      setSubmittedColumnFunctionSearchState(rawParsed);
      setColumnFunctionSearchState(rawParsed);
    }
  }, [value, indexMapping]);

  const indexMappingFiltered = useMemo(() => {
    return (
      indexMapping?.filter(
        (item) => item.dynamicField?.type !== "columnFunction"
      ) ?? []
    );
  }, [indexMapping]);

  const isValid = (state: FunctionDef) => {
    if (state && state.functionDef) {
      if (
        state.functionDef === "CONCAT" &&
        state?.params?.items &&
        _.compact(state.params.items).length > 1
      ) {
        return true;
      } else if (state.functionDef === "CONVERT_COORDINATES_DD") {
        state.params = {
          column: "collectingEvent.eventGeom"
        };
        return true;
      }
    }
    return false;
  };

  const selectedFunction =
    formulaOptions?.find(
      (formula) => formula.value === columnFunctionSearchState.functionDef
    ) ?? null;

  const functionParams = (
    _.compact(columnFunctionSearchState?.params?.items) as (
      | ESIndexMapping
      | undefined
    )[]
  ).concat(undefined);

  const setFunctionParam = (fieldPath: string, index: number) => {
    const params = columnFunctionSearchState?.params?.items ?? [];
    params[index] = indexMapping?.find((item) => item.value === fieldPath);

    const submittedParams =
      submittedColumnFunctionSearchState?.params?.items ?? [];
    submittedParams[index] = indexMapping?.find(
      (item) => item.value === fieldPath
    );

    setColumnFunctionSearchState({
      functionDef: columnFunctionSearchState.functionDef,
      params: { ...columnFunctionSearchState.params, items: params }
    });
    setSubmittedColumnFunctionSearchState({
      functionDef: submittedColumnFunctionSearchState.functionDef,
      params: {
        ...submittedColumnFunctionSearchState.params,
        items: submittedParams
      }
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
        const params = [
          ...(submittedColumnFunctionSearchState?.params?.items ?? [])
        ];
        let indexValue: string;
        let foundIndexMapping: ESIndexMapping | undefined = undefined;
        switch (field.dynamicField.type) {
          case "managedAttribute":
            indexValue = `${
              JSON.parse(fieldPath)?.selectedManagedAttributeConfig?.value
            }`;

            if (
              field.parentName &&
              JSON.parse(fieldPath)?.selectedManagedAttribute?.key
            ) {
              indexValue = `${field.parentName}.${field.label}.${
                JSON.parse(fieldPath)?.selectedManagedAttribute?.key
              }`;
              foundIndexMapping = {
                ...field,
                value: indexValue
              };
            }
            break;
          case "fieldExtension":
            indexValue = `${field.path}.${
              JSON.parse(fieldPath)?.selectedExtension
            }.${JSON.parse(fieldPath)?.selectedField}`;
            if (field.parentName) {
              indexValue = indexValue.replace(
                "included.attributes",
                field.parentName
              );
              foundIndexMapping = {
                ...field,
                value: indexValue
              };
            }
            break;
          case "classification":
            indexValue = `${field.path}.${
              JSON.parse(fieldPath)?.selectedClassificationRank
            }`;

            break;
          case "identifier":
            indexValue = `${
              JSON.parse(fieldPath)?.selectedIdentifierConfig?.value
            }`;
            break;
          default:
            break;
        }
        foundIndexMapping =
          foundIndexMapping ??
          indexMapping?.find((item) => {
            return item.value === indexValue;
          });

        // Only update state if new indexMapping is different from prev
        if (
          foundIndexMapping &&
          JSON.stringify(foundIndexMapping) !== JSON.stringify(params.at(index))
        ) {
          params[index] = foundIndexMapping;

          // Update dynamicField for submitted column function search state only to prevent unwanted dropdown changes
          setSubmittedColumnFunctionSearchState((prev) => ({
            ...prev,
            params: { ...prev.params, items: params }
          }));
        }
      }
    };
  }
}
