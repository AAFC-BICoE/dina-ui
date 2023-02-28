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
  ManagedAttributes = "ManagedAttributes",
  VOCABULARY = "vocabulary"
}

export const DATATYPE_CONVERTER_MAPPING = {
  [DataTypeEnum.NUMBER]: convertNumber,
  [DataTypeEnum.BOOLEAN]: convertBoolean,
  [DataTypeEnum.STRING_ARRAY]: convertStringArray,
  [DataTypeEnum.NUMBER_ARRAY]: convertNumberArray,
  [DataTypeEnum.ManagedAttributes]: convertMap,
  [DataTypeEnum.BOOLEAN_ARRAY]: convertBooleanArray, 
  [DataTypeEnum.STRING]: (value) => (value),
  [DataTypeEnum.VOCABULARY]: (value) => (value)
}

export function useFieldConverters(mappingConfig: {
  [key: string]: { [field: string]: { dataType: DataTypeEnum } };
}) {
  function getConverter(entityName: string, fieldName: string): any {
    if (Object.keys(mappingConfig).indexOf(entityName) === -1) {
      throw new Error(`Unknown entity type: ${entityName}`);
    }
    const dataType = mappingConfig[entityName][fieldName]?.dataType;
    if (!!dataType) {
      return DATATYPE_CONVERTER_MAPPING[dataType];
    } else {
      throw new Error(`Unknown field name: ${entityName}.${fieldName}`);
    }
  }

  return { getConverter, isNumber, isBoolean, isMap };
}
