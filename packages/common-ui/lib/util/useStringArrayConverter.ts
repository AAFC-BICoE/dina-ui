import _ from "lodash";

export function useStringArrayConverter() {
  function convertArrayToString(arrayValue: string[]) {
    return (arrayValue || []).join(", ");
  }
  function convertStringToArray(stringValue) {
    return _.compact(
      _.split(stringValue || "", ",").map((item) => item.trim())
    );
  }
  return [convertArrayToString, convertStringToArray];
}
