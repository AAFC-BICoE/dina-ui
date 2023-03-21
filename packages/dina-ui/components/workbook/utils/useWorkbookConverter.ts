import { InputResource, KitsuResource } from "kitsu";
import { filter, get, has } from "lodash";
import {
  convertBoolean,
  convertBooleanArray,
  convertDate,
  convertMap,
  convertNumber,
  convertNumberArray,
  convertStringArray,
  flattenObject
} from "./workbookMappingUtils";

export enum DataTypeEnum {
  NUMBER = "number",
  BOOLEAN = "boolean",
  STRING = "string",
  DATE = "date",
  STRING_ARRAY = "string[]",
  NUMBER_ARRAY = "number[]",
  BOOLEAN_ARRAY = "boolean[]",
  MANAGED_ATTRIBUTES = "managedAttributes",
  VOCABULARY = "vocabulary",
  OBJECT = "object",
  OBJECT_ARRAY = "object[]"
}

export type Leaves<T> = { [K in string]: T | Leaves<T> } & {
  [K in keyof T]?: never;
};

export type FieldMappingConfigType = Leaves<FieldConfigType>;

export type FieldConfigType = {
  dataType: DataTypeEnum;
  vocabularyEndpoint?: string;
  attributes?: FieldMappingConfigType;
};

export const DATATYPE_CONVERTER_MAPPING = {
  [DataTypeEnum.NUMBER]: convertNumber,
  [DataTypeEnum.BOOLEAN]: convertBoolean,
  [DataTypeEnum.STRING_ARRAY]: convertStringArray,
  [DataTypeEnum.NUMBER_ARRAY]: convertNumberArray,
  [DataTypeEnum.MANAGED_ATTRIBUTES]: convertMap,
  [DataTypeEnum.BOOLEAN_ARRAY]: convertBooleanArray,
  [DataTypeEnum.DATE]: convertDate,
  [DataTypeEnum.STRING]: (value) => value,
  [DataTypeEnum.VOCABULARY]: (value) => value
};

export function useWorkbookConverter(
  mappingConfig: FieldMappingConfigType,
  entityName: string
) {
  /**
   * The data structure in the flatternedConfig is like this
   * {
   *    stringArrayField: { dataType: 'string[]' },
   *    vocabularyField: { dataType: 'vocabulary', vocabularyEndpoint: 'vocabulary endpoint' },
   *    objectField: {
   *      dataType: 'object',
   *      attributes: { name: [Object], age: [Object] }
   *    },
   *    'objectField.name': { dataType: 'string' },
   *    'objectField.age': { dataType: 'number' }
   * }
   */
  const flattenedConfig = {};

  if (has(mappingConfig, entityName)) {
    const flattened = flattenObject(mappingConfig[entityName]);
    for (const key of Object.keys(flattened)) {
      const lastPos = key.lastIndexOf(".");
      const path = key.substring(0, lastPos);
      const value = get(mappingConfig, entityName + "." + path);
      flattenedConfig[path.replaceAll(".attributes.", ".")] = get(
        mappingConfig,
        entityName + "." + path
      );
    }
  }

  /**
   * Find the data type of the filed configure in FiledMappingConfig.ts.
   *
   * @param fieldName The fieldName can be a simple field name with out '.' in it if the field name is
   *                  unique in the configuration. Otherwise you need to specify a full path like
   *                  'organism.determination.verbatimScientificName'
   * @returns
   */
  function getPathOfField(fieldName: string) {
    const fieldPaths = Object.keys(flattenedConfig);
    if (fieldName.indexOf(".") === -1) {
      const filteredPaths = filter(fieldPaths, (item) =>
        item.endsWith(fieldName)
      );
      return filteredPaths.length > 0 ? filteredPaths[0] : undefined;
    } else {
      return fieldName;
    }
  }

  function getFieldConverter(fieldPath?: string) {
    const fieldDataType = fieldPath
      ? flattenedConfig[fieldPath]?.dataType
      : undefined;
    return !!fieldDataType
      ? DATATYPE_CONVERTER_MAPPING[fieldDataType]
      : undefined;
  }

  function convertWorkbook(
    workbookData: { [key: string]: any }[],
    group: string
  ): InputResource<KitsuResource & { group?: string }>[] {
    const resoureces: InputResource<KitsuResource & { group?: string }>[] = [];
    // loop throw all rows of the workbook data array
    for (const workbookRow of workbookData) {
      const resource: InputResource<KitsuResource & { group?: string }> = {
        type: entityName,
        group
      } as InputResource<KitsuResource & { group?: string }>;

      // The fieldNameInWorkbook can be a simple field name if it is unique in the configuration;
      // or a full name like 'organism.determination.verbatimScientificName'
      for (const fieldNameInWorkbook of Object.keys(workbookRow)) {
        // The fieldPath with be the full path, for example 'organism.determination.verbatimScientificName",
        // even the fieldNameInWorkbook is 'verbatimScientificName'
        const fieldPath = getPathOfField(fieldNameInWorkbook);
        if (fieldPath) {
          let parent = resource;
          const fieldNameArray = fieldPath.split(".");
          let childPath = "";
          for (let i = 0; i < fieldNameArray.length - 1; i++) {
            const childName = fieldNameArray[i];
            childPath = childPath + "." + childName;
            const childDataType = flattenedConfig[childPath]?.dataType;
            let child: InputResource<KitsuResource & { group?: string }>;
            if (childDataType === DataTypeEnum.OBJECT) {
              child = parent[childName];
            } else {
              child = parent[childName] ? parent[childName][0] : undefined;
            }
            if (!child) {
              child = {
                type: childName,
                group
              } as InputResource<KitsuResource & { group?: string }>;
              if (childDataType === DataTypeEnum.OBJECT) {
                parent[childName] = child;
              } else {
                parent[childName] = [child];
              }
            }
            parent = child;
          }

          const convertField = getFieldConverter(fieldPath);
          if (!!convertField) {
            parent[fieldNameArray[fieldNameArray.length - 1]] = convertField(
              workbookRow[fieldNameInWorkbook]
            );
          }
        }
      }
      resoureces.push(resource);
    }
    return resoureces;
  }

  return {
    convertWorkbook,
    flattenedConfig,
    getFieldConverter,
    getPathOfField
  };
}
