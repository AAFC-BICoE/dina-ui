import { compact, split } from "lodash";

export function useStringArrayConverter() {
  function convertArrayToString(arrayValue: string[]) {
    return (arrayValue || []).join(", ");
  }
  function convertStringToArray(stringValue) {
    return compact(split(stringValue || "", ",").map((item) => item.trim()));
  }
  return [convertArrayToString, convertStringToArray];
}
