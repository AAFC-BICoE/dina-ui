import { InputResource, KitsuResource } from "kitsu";
import { get, has } from "lodash";
import {
  convertBoolean,
  convertBooleanArray,
  convertDate,
  convertMap,
  convertNumber,
  convertNumberArray,
  convertStringArray
} from "./workbookMappingUtils";

export type mappingConfigType = {
  [key: string]: {
    [field: string]: FieldDataTypeMappingType | SubFieldDataTypeMappingType;
  };
};

export enum DataTypeEnum {
  NUMBER = "number",
  BOOLEAN = "boolean",
  STRING = "string",
  DATE = "date",
  STRING_ARRAY = "string[]",
  NUMBER_ARRAY = "number[]",
  BOOLEAN_ARRAY = "boolean[]",
  MAP = "Map",
  VOCABULARY = "vocabulary"
}

export const DATATYPE_CONVERTER_MAPPING = {
  [DataTypeEnum.NUMBER]: convertNumber,
  [DataTypeEnum.BOOLEAN]: convertBoolean,
  [DataTypeEnum.STRING_ARRAY]: convertStringArray,
  [DataTypeEnum.NUMBER_ARRAY]: convertNumberArray,
  [DataTypeEnum.MAP]: convertMap,
  [DataTypeEnum.BOOLEAN_ARRAY]: convertBooleanArray,
  [DataTypeEnum.DATE]: convertDate,
  [DataTypeEnum.STRING]: (value) => value,
  [DataTypeEnum.VOCABULARY]: (value) => value
};

export type FieldDataTypeMappingType = {
  dataType: DataTypeEnum;
  vocabularyEndpoint?: string;
};
export type SubFieldDataTypeMappingType = {
  [field: string]: FieldDataTypeMappingType;
};

export function useWorkbookConverter(mappingConfig: any, entityType: string) {
  /**
   * Get the converter for a field.  The field name can be a dot (.) separated string, for example "organism.lifeStage".
   * If you try to get the converter of a sub-entity's field, for example material-sample.organism.lifStage, you can use
   * getFieldConverter('lifeStage') if "lifeSage" is a unique field name in material-sample. Otherwise you
   * have to use getFieldConverter('organism.lifeSage')
   *
   * @param entityType: A string entity name
   * @param fieldName: A string field name.
   * @returns
   */
  function getFieldConverter(fieldName: string): any {
    if (!has(mappingConfig, entityType)) {
      throw new Error(`Unknown entity type: ${entityType}`);
    }
    const path = `${entityType}.${fieldName}.dataType`;
    const dataType: string | null = get(mappingConfig, path, null);
    if (!!dataType) {
      return DATATYPE_CONVERTER_MAPPING[dataType];
    } else {
      throw new Error(`Unknown field name: ${entityType}.${fieldName}`);
    }
  }

  function convertWorkbook(
    workbookData: { [key: string]: any }[],
    group: string
  ): InputResource<KitsuResource & { group?: string }>[] {
    const data: InputResource<KitsuResource & { group?: string }>[] = [];
    for (const workbookRow of workbookData) {
      const dataItem: InputResource<KitsuResource & { group?: string }> = {
        type: entityType,
        group
      } as InputResource<KitsuResource & { group?: string }>;
      for (const field of Object.keys(workbookRow)) {
        const convertField = getFieldConverter(field);
        if (!!convertField) {
          dataItem[field] = convertField(workbookRow[field]);
        }
      }
      data.push(dataItem);
    }
    return data;
  }

  return { getFieldConverter, convertWorkbook };
}
