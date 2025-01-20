import { Tooltip } from "common-ui";
import { useEffect, useState } from "react";
import { InputGroup } from "react-bootstrap";
import { useIntl } from "react-intl";
import DatePicker from "react-datepicker";
import { useQueryBuilderEnterToSearch } from "./useQueryBuilderEnterToSearch";

export type SupportedBetweenTypes = "number" | "text" | "date";

export interface QueryBetweenSupportProps {
  /**
   * Current match type being used.
   */
  matchType?: string;

  /**
   * Element type, text counts a number since that what the range is being performed on.
   */
  type: SupportedBetweenTypes;

  /**
   * Retrieve the current value from the Query Builder.
   */
  value?: string;

  /**
   * Pass the selected value to the Query Builder to store.
   */
  setValue?: (fieldPath: string) => void;
}

export interface BetweenStates {
  /** Lower bound */
  low: string;

  /** Upper bound */
  high: string;
}

export const DEFAULT_TYPE = {
  low: "",
  high: ""
};

/**
 * Helper function to check if value is a BetweenStates object
 */
export const isBetweenStateObject = (val: any): val is BetweenStates =>
  val != null && typeof val === "object" && "low" in val && "high" in val;

/**
 * Helper function to check if the string contains a JSON of BetweenStates.
 */
export const isBetweenStateString = (val: string): val is string => {
  try {
    // Attempt to parse the string as a BetweenStates object
    const parsedState = JSON.parse(val) as BetweenStates;

    // Check if the parsed object has the required properties
    // and is a valid BetweenStates object
    return isBetweenStateObject(parsedState);
  } catch {
    // Not a valid BetweenStates string
    return false;
  }
};

/**
 * Takes a string that might contain a BetweenStates in JSON string format and converts it into a
 * BetweenStates object.
 *
 * If it cannot be found it will just return the default value as a BetweenState object.
 *
 * @param val String that might represent a BetweenState.
 * @param type Is this a date between or a number between?
 * @returns BetweenState object
 */
export const convertStringToBetweenState = (val: string): BetweenStates => {
  try {
    const potentialBetweenObject = JSON.parse(val) as BetweenStates;
    if (isBetweenStateObject(potentialBetweenObject)) {
      return potentialBetweenObject;
    } else {
      return DEFAULT_TYPE;
    }
  } catch {
    return DEFAULT_TYPE; // Return default values on parsing error
  }
};

/**
 * Takes a potential BetweenState and converts it to a JSON string representing the values.
 *
 * If the object is something else, it will just return the default value.
 *
 * @param state Object that might be a BetweenState
 * @param type Is this a date between or a number between?
 * @returns String to be saved
 */
export const convertBetweenStateToString = (state: any): string => {
  // Double check to ensure state is actually a Between State.
  if (isBetweenStateObject(state)) {
    return JSON.stringify(state);
  } else {
    return JSON.stringify(DEFAULT_TYPE);
  }
};

export function useQueryBetweenSupport({
  type,
  matchType,
  setValue,
  value
}: QueryBetweenSupportProps) {
  const { formatMessage } = useIntl();
  const [betweenStates, setBetweenStates] =
    useState<BetweenStates>(DEFAULT_TYPE);

  // Used for submitting the query builder if pressing enter on a text field inside of the QueryBuilder.
  const onKeyDown = useQueryBuilderEnterToSearch();

  useEffect(() => {
    if (setValue && matchType === "between") {
      setValue(convertBetweenStateToString(betweenStates));
    }
  }, [betweenStates, matchType]);

  useEffect(() => {
    if (value && matchType === "between") {
      setBetweenStates(convertStringToBetweenState(value));
    }
  }, [matchType]);

  const handleBetweenChange = (newValue, bound) => {
    if (type === "number") {
      // Validate and update for numeric fields
      const numberRegex = /^\d*\.?\d*$/; // Regex for decimal numbers
      if (numberRegex.test(newValue) || newValue === "") {
        // Empty value is to allow the user to erase the value.
        setBetweenStates({
          ...betweenStates,
          [bound]: newValue === "" ? "" : newValue
        });
      }
    } else {
      // Update for non-numeric fields (allow any text)
      setBetweenStates({
        ...betweenStates,
        [bound]: newValue
      });
    }
  };

  const BetweenElement = (
    <InputGroup>
      {/* Low Bound */}
      <InputGroup.Text>
        {formatMessage({ id: "queryBuilder_operator_from" })}
      </InputGroup.Text>
      {type === "date" ? (
        <DatePicker
          name="low"
          value={betweenStates.low}
          onChange={(dateValue: Date, event) => {
            if (
              !event ||
              event?.type === "click" ||
              event?.type === "keydown"
            ) {
              handleBetweenChange(dateValue.toISOString().slice(0, 10), "low");
            }
          }}
          onChangeRaw={(event) => {
            if (event?.type === "change") {
              let newText = event.target.value;
              const dashOccurrences = newText.split("-").length - 1;
              if (newText.length === 8 && dashOccurrences === 0) {
                newText =
                  newText.slice(0, 4) +
                  "-" +
                  newText.slice(4, 6) +
                  "-" +
                  newText.slice(6);
              }
              handleBetweenChange?.(newText, "low");
            }
          }}
          dateFormat="yyyy-MM-dd"
          placeholderText="YYYY-MM-DD"
          isClearable={true}
          showYearDropdown={true}
          todayButton="Today"
          wrapperClassName="form-control"
          className="form-control rounded-0"
          onKeyDown={onKeyDown}
        />
      ) : (
        <input
          type="text"
          name="low"
          className="form-control"
          value={betweenStates.low}
          onChange={(event) => handleBetweenChange(event.target.value, "low")}
          onKeyDown={onKeyDown}
        />
      )}

      {/* High Bound */}
      <InputGroup.Text>
        {formatMessage({ id: "queryBuilder_operator_to" })}
      </InputGroup.Text>
      {type === "date" ? (
        <DatePicker
          name="high"
          value={betweenStates.high}
          onChange={(dateValue: Date, event) => {
            if (
              !event ||
              event?.type === "click" ||
              event?.type === "keydown"
            ) {
              handleBetweenChange(dateValue.toISOString().slice(0, 10), "high");
            }
          }}
          onChangeRaw={(event) => {
            if (event?.type === "change") {
              let newText = event.target.value;
              const dashOccurrences = newText.split("-").length - 1;
              if (newText.length === 8 && dashOccurrences === 0) {
                newText =
                  newText.slice(0, 4) +
                  "-" +
                  newText.slice(4, 6) +
                  "-" +
                  newText.slice(6);
              }
              handleBetweenChange?.(newText, "high");
            }
          }}
          dateFormat="yyyy-MM-dd"
          placeholderText="YYYY-MM-DD"
          isClearable={true}
          showYearDropdown={true}
          todayButton="Today"
          wrapperClassName="form-control"
          className="form-control rounded-0"
          onKeyDown={onKeyDown}
        />
      ) : (
        <input
          type="text"
          name="high"
          className="form-control"
          value={betweenStates.high}
          onChange={(event) => handleBetweenChange(event.target.value, "high")}
          onKeyDown={onKeyDown}
        />
      )}

      {/* Tooltip */}
      <InputGroup.Text>
        <Tooltip
          id={"queryBuilder_operator_between_tooltip"}
          placement="left"
          disableSpanMargin={true}
        />
      </InputGroup.Text>
    </InputGroup>
  );

  return {
    BetweenElement
  };
}
