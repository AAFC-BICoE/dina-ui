import { find, trim } from "lodash";
import { ValidationError } from "yup";
import { FieldMapType } from "../column-mapping/WorkbookColumnMapping";
import {
  ColumnUniqueValues,
  WorkbookJSON,
  WorkbookRow
} from "../types/Workbook";

const BOOLEAN_CONSTS = ["yes", "no", "true", "false", "0", "1"];

/**
 * This is currently a pretty simple function but in the future you will be able to select the
 * sheet to get the headers from. For now this will simply just retrieve the first row with
 * content.
 *
 * @param spreadsheetData Whole spreadsheet data to retrieve the headers from.
 * @param sheetNumber the sheet index (starting from 0) to pull the header columns from.
 * @return An array of the columns from the spreadsheet. Null if no headers could be found.
 */
export function getColumnHeaders(
  spreadsheetData: WorkbookJSON | undefined,
  sheetNumber: number
) {
  const data = spreadsheetData?.[sheetNumber]?.find(
    (rowData) => rowData.content.length !== 0
  );
  return data?.content ?? null;
}

export function _toPlainString(value: string) {
  if (!!value) {
    return value.replace(/\s|-|_/g, "").toLowerCase();
  } else {
    return value;
  }
}

const MATERIAL_SAMPLE_FIELD_NAME_SYNONYMS = new Map<string, string>([
  ["parent.", "parentMaterialSample."],
  ["parent id", "parentMaterialSample.materialSampleName"],
  ["parent", "parentMaterialSample.materialSampleName"],
  ["parent material sample", "parentMaterialSample.materialSampleName"],
  ["preparationmethod", "preparationMethod.name"],
  ["preparation method", "preparationMethod.name"]
]);

/**
 * find the possible field that match the column header
 * @param columnHeader The column header from excel file
 * @param fieldOptions FieldOptions that predefined in FieldMappingConfig.json
 * @returns
 */
export function findMatchField(
  columnHeader: string,
  fieldOptions: {
    label: string;
    value?: string;
    options?: {
      label: string;
      value: string;
      parentPath: string;
    }[];
  }[]
) {
  let columnHeader2: string = columnHeader.toLowerCase().trim();
  if (MATERIAL_SAMPLE_FIELD_NAME_SYNONYMS.has(columnHeader2)) {
    columnHeader2 = MATERIAL_SAMPLE_FIELD_NAME_SYNONYMS.get(columnHeader2)!;
  }
  const plainOptions: { label: string; value: string }[] = [];
  for (const opt of fieldOptions) {
    if (opt.options) {
      for (const nestOpt of opt.options) {
        plainOptions.push({ label: nestOpt.label, value: nestOpt.value });
      }
    } else {
      plainOptions.push({ label: opt.label, value: opt.value! });
    }
  }
  const prefixPos = columnHeader2.lastIndexOf(".");
  let prefix: string;
  if (prefixPos !== -1) {
    prefix = columnHeader2.substring(0, prefixPos + 1);
  }
  const option = find(plainOptions, (item) => {
    if (prefix) {
      if (MATERIAL_SAMPLE_FIELD_NAME_SYNONYMS.has(prefix)) {
        prefix = MATERIAL_SAMPLE_FIELD_NAME_SYNONYMS.get(prefix)!;
      }
      if (
        item.value.startsWith(prefix) &&
        (item.value === columnHeader2 ||
          _toPlainString(item.label) ===
            _toPlainString(columnHeader2.substring(prefixPos + 1)))
      ) {
        return true;
      } else {
        return false;
      }
    } else {
      return _toPlainString(item.label) === _toPlainString(columnHeader2);
    }
  });
  return option ? option.value : undefined;
}

/**
 * Get the data of
 *
 * @param spreadsheetData Whole spreadsheet data to retrieve the headers from.
 * @param sheetNumber the sheet index (starting from 0) to pull the header columns from.
 * @param fieldMaps
 * @param getRowNumber (optional) - if yes, gets the corresponding row number in the workbook for the row data
 * @returns
 */
export function getDataFromWorkbook(
  spreadsheetData: WorkbookJSON | undefined,
  sheetNumber: number,
  fieldMaps: FieldMapType[],
  getRowNumber?: boolean
) {
  const data: { [key: string]: any }[] = [];
  const workbookData = spreadsheetData?.[sheetNumber].filter(
    (rowData) => rowData.content.length !== 0
  );
  for (let i = 1; i < (workbookData?.length ?? 0); i++) {
    const row = workbookData?.[i];
    const rowData: { [key: string]: any } = {};
    for (let index = 0; index < fieldMaps.length; index++) {
      const fieldMap = fieldMaps[index];
      if (!fieldMap?.skipped) {
        if (fieldMap.targetKey) {
          const managedAttributes: { [key: string]: any } =
            rowData[fieldMap.targetField!] ?? {};
          let value: any;
          switch (fieldMap.targetKey.vocabularyElementType) {
            case "BOOL":
              value = convertBoolean(row?.content[index]);
              break;
            case "INTEGER":
            case "DECIMAL":
              value = convertNumber(row?.content[index]);
              break;
            case "DATE":
              value = convertDate(row?.content[index]);
              break;
            case "PICKLIST":
            case "STRING":
              value = convertString(row?.content[index]);
              break;
          }
          if (value !== null) {
            managedAttributes[fieldMap.targetKey.key] = value;
            rowData[fieldMap.targetField!] = managedAttributes;
          }
        } else {
          rowData[fieldMap.targetField!] = row?.content[index];
        }
      }
    }
    if (!!getRowNumber) {
      rowData.rowNumber = row?.rowNumber;
    }
    data.push(rowData);
  }
  return data;
}

/**
 * Check is a string a number value
 * @param value string
 * @returns number
 */
export function isNumber(value: string | null | undefined): boolean {
  const num = convertNumber(value);
  return typeof num === "number" && !isNaN(num);
}

/**
 * Check if a comma separated string a number array
 * @param value
 * @returns
 */
export function isNumberArray(value: string | null | undefined): boolean {
  if (!!value) {
    for (const val of value.split(",")) {
      if (isNumber(val)) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Check if a comma separated string a boolean value.
 * @param value String, it can be 'true', 'false', 'yes', 'no', '1', or '0'
 * @returns boolean
 */
export function isBoolean(value: string): boolean {
  return !!value && BOOLEAN_CONSTS.indexOf(value.toLowerCase()) > -1;
}

/**
 * Check is a comma separated string a boolean array
 * @param value string.  It can be 'true, false, No, yes', '1', or '0'
 * @returns
 */
export function isBooleanArray(value: string): boolean {
  const arr = value.split(",");
  return (
    arr.map((item) => trim(item)).filter((item) => !isBoolean(item)).length ===
    0
  );
}

/**
 * Check if a string a map pair
 * @param value string, it can be 'key:value, key2:"value with comma or colon chars", key3 : value3'
 * @returns boolean
 */
export function isMap(value: string): boolean {
  const regex =
    /^[a-zA-Z_0-9]+\s*:\s*(?:(?:"(?:\\"|[^"])*"|“(?:\\"|[^“”])*”|[^,"\n]+))(?:,\s*[a-zA-Z_0-9]+\s*:\s*(?:(?:"(?:\\"|[^"])*"|“(?:\\"|[^“”])*”|[^,"\n]+)))*$/;
  return !!value && regex.test(value);
}

/**
 * Check if the input managed attribute is valid
 * @param value string, it can be 'key:value, key2:"value with comma or colon chars", key3 : value3'
 * @returns boolean
 */
export function isValidManagedAttribute(
  workbookManagedAttributes: { [key: string]: string },
  endpointManagedAttributes: any[],
  formatMessage: (id, values?) => string
) {
  Object.keys(workbookManagedAttributes).forEach(
    (workbookManagedAttributeKey) => {
      const workbookManagedAttributeValue =
        workbookManagedAttributes[workbookManagedAttributeKey];
      const matchedManagedAttribute = endpointManagedAttributes.find(
        (endpointManagedAttribute) =>
          endpointManagedAttribute.key === workbookManagedAttributeKey
      );
      if (!matchedManagedAttribute) {
        const key = workbookManagedAttributeKey;
        const param = { key };
        throw new ValidationError(
          formatMessage("workBookInvalidManagedAttributeKey", param),
          "managedAttributes",
          "sheet"
        );
      }
      if (
        matchedManagedAttribute.vocabularyElementType === "BOOL" &&
        !isBoolean(workbookManagedAttributeValue.toString())
      ) {
        const key = workbookManagedAttributeKey;
        const type = matchedManagedAttribute.vocabularyElementType;
        const param = { key, type };
        throw new ValidationError(
          formatMessage("workBookInvalidManagedAttributeDataType", param),
          "managedAttributes",
          "sheet"
        );
      }
    }
  );
}

/**
 * convert a string to number
 * @param value string
 * @returns number
 */
export function convertNumber(value: any, _fieldName?: string): number | null {
  if (value !== null && value !== undefined && value !== "" && !isNaN(+value)) {
    return +value;
  } else {
    return null;
  }
}

/**
 * convert string to a boolean value
 * @param value string, it can be 'true', 'false', 'yes', or 'no'
 * @returns boolean
 */
export function convertBoolean(value: any, _fieldName?: string): boolean {
  const strBoolean = String(value).toLowerCase().trim();
  if (strBoolean === "false" || strBoolean === "no" || strBoolean === "0") {
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
export function convertStringArray(value: any, _fieldName?: string): string[] {
  const arr = value.split(/,(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/);
  return arr.map((str) => trim(trim(str, '"')));
}

/**
 * Convert comma separated number string into array of numbers.
 *
 * @param value comma separated number string, e.g. "111,222,333,444"
 * Any items that are not number will be filter out.
 */
export function convertNumberArray(value: any, fieldName?: string): number[] {
  const arr = value.split(",");
  return arr
    .map((item) => trim(item))
    .filter((item) => item !== "")
    .map((item) => convertNumber(item.trim(), fieldName))
    .filter((item) => typeof item === "number" && !isNaN(item)) as number[];
}

/**
 * convert comma separated boolean string into array of boolean
 * @param value
 */
export function convertBooleanArray(value: any, fieldName?: string): boolean[] {
  const arr = value.split(",");
  return arr
    .map((item) => trim(item))
    .filter((item) => item !== "")
    .map((item) => convertBoolean(item.trim(), fieldName)) as boolean[];
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
export function convertMap(
  value: any,
  _fieldName?: string
): { [key: string]: any } {
  const regx = /:(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/;
  const items = value
    .split(/,(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/)
    .map((str) => trim(str));
  const map = {} as { [key: string]: any };
  for (const keyValue of items) {
    if (keyValue) {
      const arr = keyValue
        .split(regx)
        .map((str) => trim(trim(str, '"').replace('"', "")));
      if (arr && arr.length === 2 && arr[0] !== "" && arr[1] !== "") {
        const key = arr[0];
        const strVal = arr[1];
        if (isBoolean(strVal)) {
          map[key] = convertBoolean(strVal);
        } else if (isNumber(strVal)) {
          map[key] = convertNumber(strVal);
        } else {
          map[key] = strVal;
        }
      }
    }
  }
  return map;
}

export function convertDate(value: any, _fieldName?: string) {
  if (isNumber(value)) {
    const dateNum = convertNumber(value);
    const excelEpoc = new Date(1900, 0, -1).getTime();
    const msDay = 86400000;
    const date = new Date(excelEpoc + (dateNum ?? 0) * msDay);
    return date.toISOString().split("T")[0];
  } else if (typeof value === "string" && value.trim() !== "") {
    return value.trim();
  } else {
    return null;
  }
}

export function convertString(value: any, _filename?: string) {
  if (value && typeof value === "string" && value.trim() !== "") {
    return value.trim();
  } else {
    return null;
  }
}

export function isObject(value: any) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isEmptyWorkbookValue(value: any): boolean {
  if (value === undefined || value === null) {
    return true;
  }
  if (typeof value === "string" && value.trim() === "") {
    return true;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return true;
    } else {
      let emptyObject = true;
      for (const item of value) {
        if (!isEmptyWorkbookValue(item)) {
          emptyObject = false;
        }
      }
      return emptyObject;
    }
  }
  if (typeof value === "object" && !Array.isArray(value)) {
    const keys = Object.keys(value).filter((k) => k !== "relationshipConfig");
    let emptyObject = true;
    for (const key of keys) {
      if (!isEmptyWorkbookValue(value[key])) {
        emptyObject = false;
        break;
      }
    }
    return emptyObject;
  }
  return false;
}

/**
 * Flattern an object into a one level property:value object. For example, it will convert
 *   mockEntity: {
 *      objectField: {
 *        name: { dataType: DataTypeEnum.STRING },
 *      }
 *    }
 *   into
 *   {
 *    "mockEntity.objectField.name.dataType": DataTypeEnum.STRING
 *   }
 * @param source
 * @returns
 */
export function flattenObject(source: any) {
  return isObject(source)
    ? Object.fromEntries(
        Object.entries(source).flatMap(([key, value]) =>
          ((flattenValue) =>
            isObject(flattenValue)
              ? Object.entries(flattenValue).map(([valueKey, valueValue]) => [
                  `${key}.${valueKey}`,
                  valueValue
                ])
              : [[key, value]])(flattenObject(value))
        )
      )
    : source;
}

export const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function calculateColumnUniqueValuesFromSpreadsheetData(
  spreadsheetData: WorkbookJSON
): ColumnUniqueValues {
  const result: ColumnUniqueValues = {};
  for (const sheet of Object.keys(spreadsheetData)) {
    const columnUniqueValues: {
      [columnName: string]: { [value: string]: number };
    } = {};
    const workbookRows: WorkbookRow[] = spreadsheetData[sheet];
    const columnNames: string[] = workbookRows[0].content;
    for (let colIndex = 0; colIndex < columnNames.length; colIndex++) {
      const counts: { [value: string]: number } = {};
      for (let rowIndex = 1; rowIndex < workbookRows.length; rowIndex++) {
        if (
          !!workbookRows[rowIndex].content[colIndex] &&
          workbookRows[rowIndex].content[colIndex].trim() !== ""
        ) {
          const value = workbookRows[rowIndex].content[colIndex].trim();
          counts[value] = 1 + (counts[value] || 0);
        }
      }
      columnUniqueValues[columnNames[colIndex]] = counts;
    }
    result[sheet] = columnUniqueValues;
  }
  return result;
}

export function getParentFieldPath(fieldPath: string) {
  if (fieldPath.includes(".")) {
    const lastIndex = fieldPath.lastIndexOf(".");
    return fieldPath.substring(0, lastIndex);
  } else {
    return undefined;
  }
}
