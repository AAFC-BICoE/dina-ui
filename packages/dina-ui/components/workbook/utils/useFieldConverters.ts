import { find, trim } from "lodash";

export function useFieldConverters(mappingConfig: {
  [key: string]: { field: string; dataType: string }[];
}) {
  function convertNumber(value: any): number | null | undefined {
    if (value !== null && value !== undefined) {
      return +value;
    } else {
      return value;
    }
  }

  function convertBoolean(value: any): boolean {
    const strBoolean = String(value).toLowerCase().trim();
    if (strBoolean === "false" || strBoolean === "no") {
      return false;
    }
    return !!value;
  }

  /**
   * Convert comma separated string into array of strings.
   *
   * If a value contains a comman, please wrap the value with double quote.
   *
   * @param value Comma separated string, e.g.  `asdb,deeasdf,sdf,"sdf,sadf" , sdfd`
   *
   */
  function convertStringArray(value: string): string[] {
    const arr = value.split(/,(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/);
    return arr.map((str) => trim(trim(str, '"')));
  }

  function _isNumber(value: string): boolean {
    const num = convertNumber(value);
    return typeof num === "number" && !isNaN(num);
  }

  function _isBoolean(value: string): boolean {
    const strBoolean = String(value).toLowerCase().trim();
    return (
      strBoolean === "true" ||
      strBoolean === "false" ||
      strBoolean === "yes" ||
      strBoolean === "no"
    );
  }

  /**
   * Convert comma separated number string into array of numbers.
   *
   * @param value comma separated number string, e.g. "111,222,333,444"
   * Any items that are not number will be filter out.
   */
  function convertNumberArray(value: string): number[] {
    const arr = value.split(",");
    return arr
      .map((item) => trim(item))
      .filter((item) => item !== "")
      .map((item) => convertNumber(item.trim()))
      .filter((item) => typeof item === "number" && !isNaN(item)) as number[];
  }
  /**
   * convert string into a map
   * @param value Map type of string.
   *
   * Here is an example of the data:
   * "key1:value1, key2:value2, key3: value3"
   *
   * If a value contains a comman (,) or a colon (:), please wrap the value with double quote. For example:
   * 'key1: "abc,def:123", key2: value2'
   *
   * Any item in the value string has no key or value will be filtered out.
   *
   */
  function convertMap(value: string): { [key: string]: any } {
    const regx = /:(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/;
    const items = value
      .split(/,(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/)
      .map((str) => trim(str));
    const map = {} as { [key: string]: any };
    for (const keyValue of items) {
      if (keyValue) {
        const arr = keyValue.split(regx).map((str) => trim(trim(str, '"')));
        if (arr && arr.length === 2 && arr[0] !== "" && arr[1] !== "") {
          const key = arr[0];
          const strVal = arr[1];
          if (_isBoolean(strVal)) {
            map[key] = convertBoolean(strVal);
          } else if (_isNumber(strVal)) {
            map[key] = convertNumber(strVal);
          } else {
            map[key] = strVal;
          }
        }
      }
    }

    return map;
  }

  function getConverter(entityName: string, fieldName: string) {
    if (Object.keys(mappingConfig).indexOf(entityName) === -1) {
      throw new Error(`Unknown entity name: ${entityName}`);
    }
    const dataType = find(
      mappingConfig[entityName],
      (item) => item.field === fieldName
    )?.dataType;
    if (!!dataType) {
      switch (dataType) {
        case "number":
          return convertNumber;
        case "boolean":
          return convertBoolean;
        case "string[]":
          return convertStringArray;
        case "number[]":
          return convertNumberArray;
        case "Map":
          return convertMap;
      }
    } else {
      throw new Error(`Unknown field name: ${entityName}.${fieldName}`);
    }
    return (value) => value;
  }

  return { getConverter };
}
