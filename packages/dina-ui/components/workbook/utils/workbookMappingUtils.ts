import _ from "lodash";
import { ValidationError } from "yup";
import { FieldMapType } from "../column-mapping/WorkbookColumnMapping";
import {
  ColumnUniqueValues,
  FieldMappingConfigType,
  WorkbookJSON,
  WorkbookRow
} from "../types/Workbook";
import { WorkbookDataTypeEnum } from "../types/WorkbookDataTypeEnum";

const BOOLEAN_CONSTS = ["yes", "no", "true", "false", "0", "1"];

export interface WorkbookColumnInfo {
  /**
   * In the spreadsheet, the top row.
   */
  columnHeader: string;

  /**
   * Alises generated from the template generator, this should match the current column header.
   * If not, a warning should appear to the user.
   */
  columnAlias?: string;

  /**
   * Hidden properties inside of the excel file, these are generated from templates.
   */
  originalColumn?: string;
}

/**
 * Using the WorkbookJSON provided, generate a list columns.
 *
 * @param spreadsheetData Whole spreadsheet data to retrieve the headers from.
 * @param sheetNumber the sheet index (starting from 0) to pull the header columns from.
 * @return An array of the columns from the spreadsheet. Null if no headers could be found.
 */
export function getColumnHeaders(
  spreadsheetData: WorkbookJSON | undefined,
  sheetNumber: number
): WorkbookColumnInfo[] | null {
  const data = spreadsheetData?.[sheetNumber]?.rows?.find(
    (rowData) => rowData.content.length !== 0
  );

  const maxLength =
    _.max([
      data?.content?.length ?? 0,
      spreadsheetData?.[sheetNumber]?.originalColumns?.length ?? 0,
      spreadsheetData?.[sheetNumber]?.columnAliases?.length ?? 0
    ]) ?? 0;

  const columnHeaders: WorkbookColumnInfo[] = [];
  for (let i = 0; i < maxLength; i++) {
    columnHeaders.push({
      columnHeader: data?.content?.[i] ?? "",
      originalColumn: spreadsheetData?.[sheetNumber]?.originalColumns?.[i],
      columnAlias: spreadsheetData?.[sheetNumber]?.columnAliases?.[i]
    });
  }

  return columnHeaders.length > 0 ? columnHeaders : null;
}

/**
 * Scans through the Workbook columns and detects if there is a template integrity warning that
 * should appear.
 *
 * This occurs when the generated template excel column headers don't match the hidden properties
 * aliases.
 *
 * @param spreadsheetColumns List of all the columns to scan against.
 * @returns true if valid, false if invalid.
 */
export function validateTemplateIntegrity(
  spreadsheetColumns: WorkbookColumnInfo[]
): boolean {
  const allOriginalColumns = spreadsheetColumns
    .map((col) => col.originalColumn)
    .filter((originalCol) => originalCol !== undefined);
  const allColumnAliases = spreadsheetColumns
    .map((col) => col.columnAlias)
    .filter((aliasCol) => aliasCol !== undefined);
  const allColumnHeaders = spreadsheetColumns
    .map((col) => col.columnHeader)
    .filter((columnHeader) => columnHeader !== "");

  // If no original or aliases provided, no validation required.
  if (allOriginalColumns.length === 0 && allColumnAliases.length === 0) {
    return true;
  }

  // Check for mismatch of number of columns.
  if (
    allOriginalColumns.length !== allColumnHeaders.length ||
    allColumnAliases.length !== allColumnHeaders.length
  ) {
    return false;
  }

  // Check for changed column names.
  for (let i = 0; i < allColumnHeaders.length; i++) {
    const currentHeader = allColumnHeaders[i];
    if (
      currentHeader !== allOriginalColumns[i] &&
      currentHeader !== allColumnAliases[i]
    ) {
      return false;
    }
  }

  // All headers match originals or aliases, return true
  return true;
}

export function _toPlainString(value: string) {
  if (!!value) {
    return value.replace(/\s|-|_/g, "").toLowerCase();
  } else {
    return value;
  }
}

const SYNONYMS_MAP_BY_TYPE = new Map<string, Map<string, string>>([
  [
    "material-sample",
    new Map([
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
      ],
      ["latitude", "collectingEvent.geoReferenceAssertions.dwcDecimalLatitude"],
      [
        "longitude",
        "collectingEvent.geoReferenceAssertions.dwcDecimalLongitude"
      ],
      ["collecting event remarks", "collectingEvent.remarks"]
    ])
  ],
  [
    "metadata",
    new Map([
      ["file name", "fileName"],
      ["original filename", "originalFilename"],
      ["original file name", "originalFilename"],
      ["date original version created", ""],
      ["caption", "acCaption"],
      ["stored object type", "dcType"],
      ["object type", "dcType"],
      ["type", "dcType"],
      ["subtype", "acSubtype"],
      ["object subtype", "acSubtype"],
      ["digitalized by", "dcCreator.displayName"]
    ])
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
 * Generates the full list of possible fields for the user to select.
 *
 * @param flattenedConfig Workbook configuration with all the possible fields.
 * @param formatMessage for translation and label generation.
 */
export function generateWorkbookFieldOptions(
  flattenedConfig: any,
  formatMessage: (id, values?) => string
) {
  const nonNestedRowOptions: { label: string; value: string }[] = [];
  const nestedRowOptions: {
    label: string;
    value: string;
    parentPath: string;
  }[] = [];

  // const newFieldOptions: { label: string; value: string }[] = [];
  Object.keys(flattenedConfig).forEach((fieldPath) => {
    if (fieldPath === "relationshipConfig") {
      return;
    }
    const config = flattenedConfig[fieldPath];
    if (
      config.dataType !== WorkbookDataTypeEnum.OBJECT &&
      config.dataType !== WorkbookDataTypeEnum.OBJECT_ARRAY
    ) {
      // Handle creating options for nested path for dropdown component
      if (fieldPath.includes(".")) {
        const lastIndex = fieldPath.lastIndexOf(".");
        const parentPath = fieldPath.substring(0, lastIndex);
        const labelPath = fieldPath.substring(lastIndex + 1);
        const label =
          formatMessage(fieldPath as any)?.trim() ||
          formatMessage(`field_${labelPath}` as any)?.trim() ||
          formatMessage(labelPath as any)?.trim() ||
          _.startCase(labelPath);
        const option = {
          label,
          value: fieldPath,
          parentPath
        };
        nestedRowOptions.push(option);
      } else {
        // Handle creating options for non nested path for dropdown component
        const label =
          formatMessage(`field_${fieldPath}` as any)?.trim() ||
          formatMessage(fieldPath as any)?.trim() ||
          _.startCase(fieldPath);
        const option = {
          label,
          value: fieldPath
        };
        nonNestedRowOptions.push(option);
      }
    }
  });
  nonNestedRowOptions.sort((a, b) => a.label.localeCompare(b.label));

  // Using the parent name, group the relationships into sections.
  const groupedNestRowOptions = _.chain(nestedRowOptions)
    .groupBy((prop) => prop.parentPath)
    .map((group, key) => {
      const keyArr = key.split(".");
      let label: string | undefined;
      for (let i = 0; i < keyArr.length; i++) {
        const k = keyArr[i];
        label =
          label === undefined
            ? formatMessage(k as any).trim() || _.startCase(k)
            : label + (formatMessage(k as any).trim() || _.startCase(k));
        if (i < keyArr.length - 1) {
          label = label + ".";
        }
      }

      return {
        label: label!,
        options: group
      };
    })
    .sort((a, b) => a.label.localeCompare(b.label))
    .value();

  return nonNestedRowOptions
    ? [...nonNestedRowOptions, ...groupedNestRowOptions]
    : [];
}

/**
 * Generate a transformed flatten version of the workbook uploader config.
 *
 * Structure looks like:
 *
 * ```
 * {
 *    stringArrayField: { dataType: 'string[]' },
 *    vocabularyField: { dataType: 'vocabulary', endpoint: 'vocabulary endpoint' },
 *    objectField: {
 *      dataType: 'object',
 *      attributes: { name: [Object], age: [Object] }
 *      relationshipConfig: {
 *         baseApiPath: "fake-api",
 *         hasGroup: true,
 *         linkOrCreateSetting: LinkOrCreateSetting.LINK_OR_CREATE,
 *         type: "object-field"
 *       }
 *    },
 *    'objectField.name': { dataType: 'string' },
 *    'objectField.age': { dataType: 'number' }
 * }
 * ```
 *
 * @param mappingConfig Mapping configuration for the workbook uploader
 * @param entityName Entity type (e.g. material-sample)
 * @returns transformed flatten version of the config.
 */
export function getFlattenedConfig(
  mappingConfig: FieldMappingConfigType,
  entityName: string
) {
  const config = {};
  if (_.has(mappingConfig, entityName)) {
    const flattened = flattenObject(mappingConfig[entityName]);
    for (const key of Object.keys(flattened)) {
      const lastPos = key.lastIndexOf(".");
      if (lastPos > -1) {
        const path = key.substring(0, lastPos);
        if (!path.endsWith(".relationshipConfig")) {
          const value = _.get(mappingConfig, entityName + "." + path);
          config[path.replaceAll(".attributes.", ".")] = value;
        }
      } else {
        const path = key;
        const value = _.get(mappingConfig, entityName + "." + path);
        config[path] = value;
      }
    }
  }
  return config;
}

/**
 * Find the possible field that matches the column header
 * @param columnHeader The column header from excel file
 * @param fieldOptions FieldOptions predefined in FieldMappingConfig.json
 * @param type The entity type, e.g. material-sample, metadata
 * @returns The matched field value or undefined
 */
export function findMatchField(
  columnHeader: WorkbookColumnInfo,
  fieldOptions: FieldOptionType[],
  type: string
): string | undefined {
  const synonymMap = getSynonymMap(type);
  const normalizedColumnHeader = normalizeColumnHeader(
    columnHeader,
    synonymMap
  );
  const flattenedOptions = flattenFieldOptions(fieldOptions);

  return findMatchingOption(
    normalizedColumnHeader,
    flattenedOptions,
    synonymMap
  );
}

/**
 * Retrieve and validate the synonyms map for the given type
 */
function getSynonymMap(type: string): Map<string, string> {
  const synonymMap = SYNONYMS_MAP_BY_TYPE.get(type);

  if (!synonymMap) {
    throw new Error(
      `Unknown type: ${type}, add this new type to the SYNONYMS_MAP_BY_TYPE.`
    );
  }

  return synonymMap;
}

/**
 * Normalize column header by applying synonyms
 */
function normalizeColumnHeader(
  columnHeader: WorkbookColumnInfo,
  synonymMap: Map<string, string>
): string {
  const rawHeader = (
    columnHeader.originalColumn ?? columnHeader.columnHeader
  ).toLowerCase();
  return synonymMap.get(rawHeader) ?? rawHeader;
}

/**
 * Flatten nested field options into a simple array
 */
function flattenFieldOptions(
  fieldOptions: FieldOptionType[]
): Array<{ label: string; value: string }> {
  return fieldOptions.flatMap((opt) =>
    opt.options
      ? opt.options.map((nestOpt) => ({
          label: nestOpt.label,
          value: nestOpt.value
        }))
      : [{ label: opt.label, value: opt.value! }]
  );
}

/**
 * Find matching option based on normalized column header
 */
function findMatchingOption(
  normalizedHeader: string,
  options: Array<{ label: string; value: string }>,
  synonymMap: Map<string, string>
): string | undefined {
  const prefixInfo = extractPrefix(normalizedHeader);

  const matchedOption = options.find((option) =>
    prefixInfo
      ? matchWithPrefix(option, normalizedHeader, prefixInfo, synonymMap)
      : matchWithoutPrefix(option, normalizedHeader, options)
  );

  return matchedOption?.value;
}

/**
 * Extract prefix from column header if it exists
 */
function extractPrefix(
  header: string
): { prefix: string; suffixStart: number } | null {
  const lastDotIndex = header.lastIndexOf(".");

  if (lastDotIndex === -1) {
    return null;
  }

  return {
    prefix: header.substring(0, lastDotIndex + 1),
    suffixStart: lastDotIndex + 1
  };
}

/**
 * Match option when prefix exists
 */
function matchWithPrefix(
  option: { label: string; value: string },
  normalizedHeader: string,
  prefixInfo: { prefix: string; suffixStart: number },
  synonymMap: Map<string, string>
): boolean {
  const normalizedPrefix = (
    synonymMap.get(prefixInfo.prefix) ?? prefixInfo.prefix
  ).toLowerCase();
  const optionValue = option.value.toLowerCase();

  if (!optionValue.startsWith(normalizedPrefix)) {
    return false;
  }

  // Check if values match exactly or if labels match (ignoring prefix)
  const suffix = normalizedHeader.substring(prefixInfo.suffixStart);
  return (
    optionValue === normalizedHeader.toLowerCase() ||
    _toPlainString(option.label) === _toPlainString(suffix)
  );
}

/**
 * Match option when no prefix exists
 */
function matchWithoutPrefix(
  option: { label: string; value: string },
  normalizedHeader: string,
  allOptions: Array<{ label: string; value: string }>
): boolean {
  return (
    option.value.toLowerCase() === normalizedHeader.toLowerCase() ||
    isValidOptionLabel(option, allOptions, normalizedHeader)
  );
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
  const workbookData = spreadsheetData?.[sheetNumber]?.rows.filter(
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
    arr.map((item) => _.trim(item)).filter((item) => !isBoolean(item))
      .length === 0
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
  return arr.map((str) => _.trim(_.trim(str, '"')));
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
    .map((item) => _.trim(item))
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
    .map((item) => _.trim(item))
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
    .map((str) => _.trim(str));
  const map = {} as { [key: string]: any };
  for (const keyValue of items) {
    if (keyValue) {
      const arr = keyValue
        .split(regx)
        .map((str) => _.trim(_.trim(str, '"').replace('"', "")));
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
    const workbookRows: WorkbookRow[] = spreadsheetData[sheet]?.rows;
    const columnNames: string[] =
      spreadsheetData[sheet]?.originalColumns ?? workbookRows[0].content;
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
      columnUniqueValues[columnNames[colIndex].replaceAll(".", "_")] = counts;
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
    const sheetData: WorkbookRow[] = data[sheet]?.rows;
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

/**
 * Automatically detect entity type based on spreadsheet column headers.
 *
 * @param spreadsheetData The uploaded workbook data
 * @param sheetIndex The sheet to analyze (default: 0)
 * @returns Detected entity type or default to "material-sample"
 */
export function detectEntityType(
  spreadsheetData: WorkbookJSON,
  sheetIndex: number = 0
): "material-sample" | "metadata" {
  const sheet = spreadsheetData?.[sheetIndex];
  if (!sheet) {
    return "material-sample";
  }

  // If template has original columns, check those first.
  if (sheet?.originalColumns && sheet.originalColumns.length > 0) {
    const originalHeaders = sheet.originalColumns.map((h) => _toPlainString(h));

    if (
      originalHeaders.some(
        (h) => h.includes("originalfilename") || h.includes("filename")
      )
    ) {
      return "metadata";
    }
    if (
      originalHeaders.some(
        (h) => h.includes("materialsamplename") || h.includes("collection")
      )
    ) {
      return "material-sample";
    }
  }

  const headers = getColumnHeaders(spreadsheetData, sheetIndex);

  // Default fallback
  if (!headers || headers.length === 0) {
    return "material-sample";
  }

  // Normalize headers for comparison
  const normalizedHeaders = headers.map((h) =>
    _toPlainString(h.originalColumn || h.columnHeader)
  );

  // Characteristic fields for metadata
  const metadataIndicators = [
    "filename",
    "originalfilename",
    "dccreator",
    "dctype",
    "accaption",
    "acdigitizationdate",
    "acsubtype",
    "dcformat",
    "dcrights",
    "orientation"
  ];

  // Characteristic fields for material-sample
  const materialSampleIndicators = [
    "materialsamplename",
    "identifier",
    "collection",
    "collectingevent",
    "preparationtype",
    "storageunit",
    "organism",
    "barcode",
    "preservationtype"
  ];

  // Count matches for each type
  let metadataScore = 0;
  let materialSampleScore = 0;

  normalizedHeaders.forEach((header) => {
    if (metadataIndicators.some((indicator) => header.includes(indicator))) {
      metadataScore++;
    }
    if (
      materialSampleIndicators.some((indicator) => header.includes(indicator))
    ) {
      materialSampleScore++;
    }
  });

  // Return type with higher score.
  return metadataScore > materialSampleScore ? "metadata" : "material-sample";
}

export function trimSpace(workbookData: WorkbookJSON) {
  for (const rows of Object.values(workbookData)) {
    for (const row of rows?.rows as WorkbookRow[]) {
      for (let i = 0; i < row.content.length; i++) {
        const value = row.content[i];
        row.content[i] = value.trim();
      }
    }
  }
  return workbookData;
}
export const PERSON_SELECT_FIELDS = new Set([
  "preparedBy.displayName",
  "collectingEvent.collectors.displayName"
]);
