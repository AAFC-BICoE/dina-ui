import {
  convertBoolean,
  convertBooleanArray,
  convertMap,
  convertNumber,
  convertNumberArray,
  convertStringArray,
  isBoolean,
  isMap,
  isNumber
} from "./workbookMappingUtils";

export enum DataTypeEnum {
  NUMBER = "number",
  BOOLEAN = "boolean",
  STRING = "string",
  STRING_ARRAY = "string[]",
  NUMBER_ARRAY = "number[]",
  BOOLEAN_ARRAY = "boolean[]",
  MAP = "Map"
}

export function useFieldConverters(mappingConfig: {
  [key: string]: { [field: string]: { dataType: DataTypeEnum } };
}) {
  function getConverter(entityName: string, fieldName: string) {
    if (Object.keys(mappingConfig).indexOf(entityName) === -1) {
      throw new Error(`Unknown entity type: ${entityName}`);
    }
    const dataType = mappingConfig[entityName][fieldName]?.dataType;
    if (!!dataType) {
      switch (dataType) {
        case DataTypeEnum.NUMBER:
          return convertNumber;
        case DataTypeEnum.BOOLEAN:
          return convertBoolean;
        case DataTypeEnum.STRING_ARRAY:
          return convertStringArray;
        case DataTypeEnum.NUMBER_ARRAY:
          return convertNumberArray;
        case DataTypeEnum.MAP:
          return convertMap;
        case DataTypeEnum.BOOLEAN_ARRAY:
          return convertBooleanArray;
      }
    } else {
      throw new Error(`Unknown field name: ${entityName}.${fieldName}`);
    }
    return (value) => value;
  }

  return { getConverter, isNumber, isBoolean, isMap };
}
