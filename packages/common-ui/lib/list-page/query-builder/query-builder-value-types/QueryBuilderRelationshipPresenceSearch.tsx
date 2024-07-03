import { useState } from "react";
import { useIntl } from "react-intl";
import { SelectOption } from "common-ui";
import { TransformToDSLProps } from "../../types";

export interface QueryRowRelationshipPresenceSearchProps {
  /**
   * Retrieve the current value from the Query Builder.
   */
  value?: string;

  /**
   * Pass the selected value to the Query Builder to store.
   */
  setValue?: (fieldPath: string) => void;
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
  value
}: QueryRowRelationshipPresenceSearchProps) {
  const { formatMessage } = useIntl();

  const [relationshipPresenceStates, setRelationshipPresenceStates] =
    useState<RelationshipPresenceSearchStates>(() =>
      value
        ? JSON.parse(value)
        : {
            selectedRelationship: "",
            selectedOperator: "",
            selectedValue: 0
          }
    );

  // Generate the operator options
  const operatorOptions = ["presence", "absence"].map<SelectOption<string>>(
    (option) => ({
      label: formatMessage({ id: "queryBuilder_operator_" + option }),
      value: option
    })
  );

  return <></>;
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
