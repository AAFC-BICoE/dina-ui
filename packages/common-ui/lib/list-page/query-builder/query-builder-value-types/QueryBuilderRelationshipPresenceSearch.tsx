import { useEffect, useState } from "react";
import { MessageFormatElement, useIntl } from "react-intl";
import { SelectOption } from "common-ui";
import { ESIndexMapping, TransformToDSLProps } from "../../types";
import Select from "react-select";
import _ from "lodash";
import {
  existsQuery,
  termQuery
} from "../query-builder-elastic-search/QueryBuilderElasticSearchExport";

export interface QueryRowRelationshipPresenceSearchProps {
  /**
   * Retrieve the current value from the Query Builder.
   */
  value?: string;

  /**
   * Pass the selected value to the Query Builder to store.
   */
  setValue?: (fieldPath: string) => void;

  /**
   * Index mapping to determine the different relationships to select from.
   */
  indexMapping: ESIndexMapping[];

  /**
   * If being used in the column selector, operators and different styling is applied.
   */
  isInColumnSelector: boolean;
}

export interface RelationshipPresenceSearchStates {
  /** The relationship to perform the presence searching on. */
  selectedRelationship: string;

  /** Operator to be used on the relationship (presence, absent, etc) */
  selectedOperator: string;

  /** Used for UUID searching or other future operators */
  selectedValue: string;
}

export default function QueryRowRelationshipPresenceSearch({
  value,
  setValue,
  indexMapping,
  isInColumnSelector
}: QueryRowRelationshipPresenceSearchProps) {
  const { formatMessage, messages } = useIntl();

  const [relationshipPresenceState, setRelationshipPresenceState] =
    useState<RelationshipPresenceSearchStates>(() =>
      value
        ? JSON.parse(value)
        : {
            selectedRelationship: "",
            selectedOperator: "",
            selectedValue: 0
          }
    );

  // Convert the state in this component to a value that can be stored in the Query Builder.
  useEffect(() => {
    if (setValue) {
      setValue(JSON.stringify(relationshipPresenceState));
    }
  }, [relationshipPresenceState, setValue]);

  const relationshipOptions: SelectOption<string>[] =
    retrieveRelationshipsFromIndexMapping(indexMapping, messages);
  const [relationshipSearchValue, setRelationshipSearchValue] =
    useState<string>("");

  // Currently selected relationship.
  const selectedRelationship =
    relationshipOptions?.find(
      (relationship) =>
        relationship.value === relationshipPresenceState.selectedRelationship
    ) ?? null;

  // Generate the operator options
  const operatorOptions = ["presence", "absence", "uuid"].map<
    SelectOption<string>
  >((option) => ({
    label: formatMessage({ id: "queryBuilder_operator_" + option }),
    value: option
  }));

  // Currently selected option, if no option can be found just select the first one.
  const selectedOperator =
    operatorOptions?.find(
      (operator) =>
        operator.value === relationshipPresenceState.selectedOperator
    ) ?? null;

  // Automatically set the operator.
  if (!selectedOperator && operatorOptions?.[0]) {
    setRelationshipPresenceState({
      ...relationshipPresenceState,
      selectedOperator: operatorOptions?.[0].value ?? ""
    });
  }

  return (
    <div className={isInColumnSelector ? "" : "row"}>
      {/* Relationship Selector */}
      <Select<SelectOption<string>>
        options={relationshipOptions}
        className={isInColumnSelector ? "ps-0 mt-2" : "col me-1 ms-2 ps-0"}
        value={selectedRelationship}
        placeholder={formatMessage({
          id: "queryBuilder_relationship_placeholder"
        })}
        onChange={(selected) =>
          setRelationshipPresenceState({
            selectedRelationship: selected?.value ?? "",
            selectedOperator: "",
            selectedValue: ""
          })
        }
        onInputChange={(inputValue) => setRelationshipSearchValue(inputValue)}
        inputValue={relationshipSearchValue}
        captureMenuScroll={true}
        menuPlacement={isInColumnSelector ? "bottom" : "auto"}
        menuShouldScrollIntoView={false}
        minMenuHeight={600}
      />

      {/* Operator Selector */}
      {!isInColumnSelector && selectedRelationship && (
        <>
          <Select<SelectOption<string>>
            options={operatorOptions}
            className={isInColumnSelector ? "ps-0 mt-2" : "col me-1 ps-0"}
            value={selectedOperator}
            onChange={(selected) =>
              setRelationshipPresenceState({
                ...relationshipPresenceState,
                selectedOperator: selected?.value ?? ""
              })
            }
          />
        </>
      )}

      {/* If UUID operator is selected, display textbox to enter UUID */}
      {selectedOperator?.value === "uuid" && (
        <>
          <input
            type="text"
            value={relationshipPresenceState.selectedValue ?? ""}
            onChange={(newValue) =>
              setRelationshipPresenceState({
                ...relationshipPresenceState,
                selectedValue: newValue?.target?.value ?? ""
              })
            }
            className={
              isInColumnSelector
                ? "form-control ps-0 mt-2"
                : "form-control col me-1 ms-2 ps-0"
            }
            placeholder={"Enter UUID..."}
          />
        </>
      )}
    </div>
  );
}

/**
 * Retrieves relationships from an array of ESIndexMapping objects.
 *
 * @param {ESIndexMapping[]} indexMapping An array of ESIndexMapping objects.
 * @returns {SelectOption<string>[]} An array of SelectOption objects containing unique labels and values representing relationships.
 */
function retrieveRelationshipsFromIndexMapping(
  indexMapping: ESIndexMapping[],
  messages: Record<string, string> | Record<string, MessageFormatElement[]>
): SelectOption<string>[] {
  return indexMapping.reduce<SelectOption<string>[]>((acc, mapping) => {
    // Check if the mapping has a parentName and if it already exists in the accumulator
    if (
      mapping.parentName &&
      !mapping.isReverseRelationship &&
      !acc.find((item) => item.value === mapping.parentName)
    ) {
      acc.push({
        label: messages["title_" + mapping.parentName]
          ? messages["title_" + mapping.parentName]
          : _.startCase(mapping.parentName),
        value: mapping.parentName
      } as SelectOption<string>);
    }

    // Sort the accumulator at this point.
    acc.sort((a, b) => a.label.localeCompare(b.label));

    return acc;
  }, []);
}

/**
 * Using the query row for a relationship presence search, generate the elastic search request to be
 * made.
 */
export function transformRelationshipPresenceToDSL({
  value
}: TransformToDSLProps): any {
  try {
    // Parse the field extension search options.
    const {
      selectedRelationship,
      selectedOperator,
      selectedValue
    }: RelationshipPresenceSearchStates = JSON.parse(value);

    // Determine if we have all the required fields to perform a search.
    if (!selectedRelationship || !selectedOperator) {
      return;
    }

    // Based on the operator, generate the elastic search query.
    switch (selectedOperator) {
      case "presence":
        return {
          bool: {
            must: existsQuery(
              "data.relationships." + selectedRelationship + ".data.id"
            )
          }
        };

      case "absence":
        return {
          bool: {
            must_not: existsQuery(
              "data.relationships." + selectedRelationship + ".data.id"
            )
          }
        };

      case "uuid":
        return {
          bool: {
            must: termQuery(
              "data.relationships." + selectedRelationship + ".data.id",
              selectedValue,
              false
            )
          }
        };
    }

    // Unsupported operator...
    return;
  } catch (e) {
    console.error(e);
    return;
  }
}
