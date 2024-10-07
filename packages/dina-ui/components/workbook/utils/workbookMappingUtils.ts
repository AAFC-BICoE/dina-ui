import { find, trim } from "lodash";
import { ValidationError } from "yup";
import { FieldMapType } from "../column-mapping/WorkbookColumnMapping";
import {
  ColumnUniqueValues,
  WorkbookJSON,
  WorkbookRow
} from "../types/Workbook";
import _ from "lodash";

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
  ["preparation method", "preparationMethod.name"],
  ["identifier", "materialSampleName"],
  ["type", "materialSampleType"],
  ["collection", "collection.name"],
  ["collections", "collection.name"],
  ["storage unit", "storageUnitUsage.storageUnit.name"],
  ["storage", "storageUnitUsage.storageUnit.name"],
  ["storageunit", "storageUnitUsage.storageUnit.name"],
  ["project", "projects.name"],
  ["projects", "projects.name"],
  ["preparation type", "preparationType.name"],
  ["preparationtype", "preparationType.name"],
  ["prepared by", "preparedBy.displayName"],
  ["preparedby", "preparedBy.displayName"],
  ["preparationprotocol", "preparationProtocol.name"],
  ["preparation protocol", "preparationProtocol.name"],
  ["assemblage", "assemblages.name"],
  ["assemblages", "assemblages.name"],
  ["collectors", "collectingEvent.collectors.displayName"],
  ["collector", "collectingEvent.collectors.displayName"],
  ["attachment", "attachment.name"],
  ["attachments", "attachment.name"],
  ["hostorganism", "hostOrganism.name"],
  ["host organism", "hostOrganism.name"],
  ["hostremarks", "hostOrganism.remarks"],
  ["host remarks", "hostOrganism.remarks"],
  ["collector's number", "collectingEvent.dwcRecordNumber"],
  ["collector number", "collectingEvent.dwcRecordNumber"],
  ["well column", "storageUnitUsage.wellColumn"],
  ["well row", "storageUnitUsage.wellRow"],
  [
    "decimal latitude",
    "collectingEvent.geoReferenceAssertions.dwcDecimalLatitude"
  ],
  [
    "decimal longitude",
    "collectingEvent.geoReferenceAssertions.dwcDecimalLongitude"
  ]
]);

export type FieldOptionType = {
  label: string;
  value?: string;
  options?: {
    label: string;
    value: string;
    parentPath: string;
  }[];
};

/**
 * find the possible field that match the column header
 * @param columnHeader The column header from excel file
 * @param fieldOptions FieldOptions that predefined in FieldMappingConfig.json
 * @returns
 */
export function findMatchField(
  columnHeader: string,
  fieldOptions: FieldOptionType[]
) {
  let columnHeader2: string = columnHeader.toLowerCase();
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
        item.value.toLowerCase().startsWith(prefix.toLowerCase()) &&
        (item.value.toLowerCase() === columnHeader2.toLowerCase() ||
          _toPlainString(item.label) ===
            _toPlainString(columnHeader2.substring(prefixPos + 1)))
      ) {
        return true;
      } else {
        return false;
      }
    } else {
      const validOptionLabel = isValidOptionLabel(
        item,
        plainOptions,
        columnHeader
      );
      return (
        item.value.toLowerCase() === columnHeader2.toLowerCase() ||
        validOptionLabel
      );
    }
  });
  return option ? option.value : undefined;
}

/**
 * Determine if the given option is valid to be used for column mapping based on option's label
 * An option is valid if its label matches the columnHeader and the option value is not nested
 * If the option value is nested, the option label must not have duplicates in plainOptions
 * @param option Dropdown option to be used for column mapping
 * @param plainOptions Dropdown options that can be used for column mapping
 * @param columnHeader The column header from excel file
 * @returns true if given option should be used for column mapping, false otherwise
 */
function isValidOptionLabel(
  option: {
    label: string;
    value: string;
  },
  plainOptions: { label: string; value: string }[],
  columnHeader: string
): boolean {
  const duplicateLabelOptions = plainOptions
    .map((plainOption) =>
      _toPlainString(plainOption.label) === _toPlainString(columnHeader)
        ? plainOption
        : undefined
    )
    .filter((plainOption) => plainOption !== undefined);
  duplicateLabelOptions.find((duplicateLabelOption) =>
    duplicateLabelOption?.value.includes(".")
  );
  if (option.value?.includes(".")) {
    // If option value is nested, the option label must match the column header and must not have duplicates
    return (
      _toPlainString(option.label) === _toPlainString(columnHeader) &&
      duplicateLabelOptions.length < 2
    );
  } else {
    // Option value is not nested, it must match the column header
    return _toPlainString(option.label) === _toPlainString(columnHeader);
  }
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
          if ("vocabularyElementType" in fieldMap.targetKey) {
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
          } else if ("key" in fieldMap.targetKey) {
            if (!rowData[fieldMap.targetField!]) {
              rowData[fieldMap.targetField!] = {};
            }
            rowData[fieldMap.targetField!][fieldMap.targetKey.key] =
              row?.content[index];
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

export const NON_ALPHA_NUMERIC_REGEX = /[^a-z0-9]/gi; // Matches any character except a-z and 0-9 (case-insensitive)

/**
 *
 * @param str1 string to compare
 * @param str2 string to compare
 * @returns true if strings are equal, false otherwise
 */
export function compareAlphanumeric(str1, str2) {
  if (str1 === str2) {
    return true;
  }
  const str1NoSpecialChars = _.deburr(str1).replace(
    NON_ALPHA_NUMERIC_REGEX,
    ""
  );
  const str2NoSpecialChars = _.deburr(str2).replace(
    NON_ALPHA_NUMERIC_REGEX,
    ""
  );
  return (
    str1NoSpecialChars.localeCompare(str2NoSpecialChars, undefined, {
      sensitivity: "base"
    }) === 0
  );
}

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
          // Replace right single quotation mark with normal apostrophe
          const value = workbookRows[rowIndex].content[colIndex].trim();
          counts[value] = 1 + (counts[value] || 0);
        }
      }
      columnUniqueValues[columnNames[colIndex].replace(".", "_")] = counts;
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

export function removeEmptyColumns(data: WorkbookJSON) {
  for (const sheet of Object.keys(data)) {
    const sheetData: WorkbookRow[] = data[sheet];
    const emptyColumnIndexes: number[] = [];
    if (sheetData.length > 1) {
      const headerRow = sheetData[0];
      headerRow.content = headerRow.content.map((header) => header.trim());
      for (let i = headerRow.content.length - 1; i >= 0; i--) {
        if (headerRow.content[i].trim() === "") {
          emptyColumnIndexes.push(i);
          headerRow.content.splice(i, 1);
        }
      }
      for (let i = 1; i < sheetData.length; i++) {
        const dataRow = sheetData[i];
        for (const emptyIdx of emptyColumnIndexes) {
          dataRow.content.splice(emptyIdx, 1);
        }
      }
    }
  }
  return data;
}

export function trimSpace(workbookData: WorkbookJSON) {
  for (const rows of Object.values(workbookData)) {
    for (const row of rows as WorkbookRow[]) {
      for (let i = 0; i < row.content.length; i++) {
        const value = row.content[i];
        row.content[i] = value.trim();
      }
    }
  }
  return workbookData;
}
