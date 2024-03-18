import { useEffect, useState } from "react";
import { InputGroup } from "react-bootstrap";
import DatePicker from "react-datepicker";

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
  low: any;

  /** Upper bound */
  high: any;
}

export const DEFAULT_TYPE = {
  low: "",
  high: ""
}

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
  } catch (error) {
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
  } catch (error) {
    return DEFAULT_TYPE; // Return default values on parsing error
  }
}

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
}

export function useQueryBetweenSupport({
  type,
  matchType,
  setValue,
  value
}: QueryBetweenSupportProps) {
  const [betweenStates, setBetweenStates] = useState<BetweenStates>(DEFAULT_TYPE);

  useEffect(() => {
    if (setValue && matchType === "between") {
      setValue(convertBetweenStateToString(betweenStates))
    }
  }, [betweenStates, matchType]);

  useEffect(() => {
    if (value && matchType === "between") {
      setBetweenStates(convertStringToBetweenState(value));
    }
  }, [matchType]);

  const BetweenElement = (type === "date") ? (
    <InputGroup>
      <InputGroup.Text>From</InputGroup.Text>
      <DatePicker
        name="low"
        className="form-control"
        value={betweenStates.low}
        onChange={(dateValue: Date) => { setBetweenStates({...betweenStates, low: dateValue && dateValue.toISOString().slice(0, 10) }); }}
        dateFormat="yyyy-MM-dd"
        placeholderText="YYYY-MM-DD"
        isClearable={true}
        showYearDropdown={true}
        todayButton="Today"
      />
      <InputGroup.Text>To</InputGroup.Text>
      <DatePicker
        name="high"
        className="form-control"
        value={betweenStates.high}
        onChange={(dateValue: Date) => { setBetweenStates({...betweenStates, high: dateValue && dateValue.toISOString().slice(0, 10) }); }}
        dateFormat="yyyy-MM-dd"
        placeholderText="YYYY-MM-DD"
        isClearable={true}
        showYearDropdown={true}
        todayButton="Today"
      />
    </InputGroup>
  ) : (
    <InputGroup>
      <InputGroup.Text>From</InputGroup.Text>
      <input
        type="number"
        name="low"
        className="form-control"
        value={betweenStates.low}
        onChange={(event) => { setBetweenStates({...betweenStates, low: Number(event.target.value) ?? betweenStates.low}) }}
      />
      <InputGroup.Text>To</InputGroup.Text>
      <input
        type="number"
        name="high"
        className="form-control"
        value={betweenStates.high}
        onChange={(event) => { setBetweenStates({...betweenStates, high: Number(event.target.value) ?? betweenStates.high}) }}
      />
    </InputGroup>
  );

  return {
    BetweenElement
  }
}