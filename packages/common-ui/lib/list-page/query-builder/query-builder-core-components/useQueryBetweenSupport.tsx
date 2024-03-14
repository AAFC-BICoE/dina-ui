import { Form, InputGroup } from "react-bootstrap";

export type SupportedBetweenTypes = "number" | "date";

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

export const getDefaultType = (type: SupportedBetweenTypes): BetweenStates => {
  switch (type) {
    case "date":
      return {
        high: "",
        low: ""
      }
    case "number":
      return {
        high: 0,
        low: 0
      }
  }
}

// Helper function to check if value is a BetweenStates object
export const isBetweenValue = (val: any): val is BetweenStates =>
  typeof val === "object" && "low" in val && "high" in val;

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
export const convertStringToBetweenState = (val: string, type: SupportedBetweenTypes): BetweenStates => {
  try {
    return JSON.parse(val) as BetweenStates;
  } catch (error) {
    return getDefaultType(type); // Return default values on parsing error
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
export const convertBetweenStateToString = (state: any, type: SupportedBetweenTypes): string => {
  // Double check to ensure state is actually a Between State.
  if (isBetweenValue(state)) {
    return JSON.stringify(state);
  } else {
    return JSON.stringify(getDefaultType(type));
  }
}

export function useQueryBetweenSupport({
  type,
  matchType,
  setValue,
  value
}: QueryBetweenSupportProps) {
  const handleValueChange = (newValue: any) => {
    if (matchType === "between") {
      // Ensure it's a high or low value and it was not altered.
      if (newValue.target.name !== "high" && newValue.target.name !== "low") {
        setValue?.(convertBetweenStateToString(getDefaultType(type), type))
        return;
      }

      // Update BetweenStates object based on current value and new value
      const currentValues = convertStringToBetweenState(value ?? "", type); // Parse current value
      const updatedValue: BetweenStates = {
        ...currentValues,
        [newValue.target.name]: newValue.target.value, // Update either low or high
      };
      setValue?.(convertBetweenStateToString(updatedValue, type)); // Stringify updated value before setting
    } else {
      setValue?.(newValue); // Set single value for other match types
    }
  };

  const BetweenElement = type === "number" ? (
    <InputGroup>
      <InputGroup.Text>From</InputGroup.Text>
      <Form.Control
        type="number"
        name="low"
        value={convertStringToBetweenState(value ?? "", type)?.low || ""} // Parse and access low value
        onChange={handleValueChange}
      />
      <InputGroup.Text>To</InputGroup.Text>
      <Form.Control
        type="number"
        name="high"
        value={convertStringToBetweenState(value ?? "", type)?.high || ""} // Parse and access high value
        onChange={handleValueChange}
      />
    </InputGroup>
  ) : (
    <></>
  );

  return {
    BetweenElement
  }
}