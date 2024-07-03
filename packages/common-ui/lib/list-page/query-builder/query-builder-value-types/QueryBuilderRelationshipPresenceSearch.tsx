import { useEffect, useState } from "react";
import { useIntl } from "react-intl";
import { SelectOption } from "common-ui";
import { ESIndexMapping, TransformToDSLProps } from "../../types";
import Select from "react-select";
import { startCase } from "lodash";

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
}

export interface RelationshipPresenceSearchStates {
  /** The relationship to perform the presence searching on. */
  selectedRelationship: string;

  /** Operator to be used on the relationship (presence, absent, etc) */
  selectedOperator: string;

  /** For future use, when we want to display count searching... */
  selectedValue: number;
}

export default function QueryRowRelationshipPresenceSearch({
  value,
  setValue,
  indexMapping
}: QueryRowRelationshipPresenceSearchProps) {
  const { formatMessage } = useIntl();

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
    retrieveRelationshipsFromIndexMapping(indexMapping);
  const [relationshipSearchValue, setRelationshipSearchValue] =
    useState<string>("");

  // Currently selected relationship.
  const selectedRelationship =
    relationshipOptions?.find(
      (relationship) =>
        relationship.value === relationshipPresenceState.selectedRelationship
    ) ?? null;

  // Generate the operator options
  const operatorOptions = ["presence", "absence"].map<SelectOption<string>>(
    (option) => ({
      label: formatMessage({ id: "queryBuilder_operator_" + option }),
      value: option
    })
  );

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
    <div className="row">
      {/* Relationship Selector */}
      <Select<SelectOption<string>>
        options={relationshipOptions}
        className={`col me-1 ms-2 ps-0`}
        value={selectedRelationship}
        placeholder={formatMessage({
          id: "queryBuilder_relationship_placeholder"
        })}
        onChange={(selected) =>
          setRelationshipPresenceState({
            selectedRelationship: selected?.value ?? "",
            selectedOperator: "",
            selectedValue: 0
          })
        }
        onInputChange={(inputValue) => setRelationshipSearchValue(inputValue)}
        inputValue={relationshipSearchValue}
      />

      {/* Operator Selector */}
      {selectedRelationship && (
        <>
          <Select<SelectOption<string>>
            options={operatorOptions}
            className={`col me-1 ps-0`}
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
  indexMapping: ESIndexMapping[]
): SelectOption<string>[] {
  return indexMapping.reduce<SelectOption<string>[]>((acc, mapping) => {
    // Check if the mapping has a parentType and if it already exists in the accumulator
    if (
      mapping.parentType &&
      !acc.find((item) => item.value === mapping.parentType)
    ) {
      acc.push({
        label: startCase(mapping.parentName),
        value: mapping.parentType
      } as SelectOption<string>);
    }
    return acc;
  }, []);
}

/**
 * Using the query row for a relationship presence search, generate the elastic search request to be
 * made.
 */
export function transformRelationshipPresenceToDSL({}: // value,
// fieldInfo
TransformToDSLProps): any {
  return {};
}
