import { useApiClient } from "common-ui";
import { InputResource, KitsuResource } from "kitsu";
import { filter, get, has, pick } from "lodash";
import { FieldMappingConfigType, WorkbookDataTypeEnum } from "..";
import {
  convertBoolean,
  convertBooleanArray,
  convertDate,
  convertMap,
  convertNumber,
  convertNumberArray,
  convertStringArray,
  flattenObject,
  isObject
} from "./workbookMappingUtils";

export const DATATYPE_CONVERTER_MAPPING = {
  [WorkbookDataTypeEnum.NUMBER]: convertNumber,
  [WorkbookDataTypeEnum.BOOLEAN]: convertBoolean,
  [WorkbookDataTypeEnum.STRING_ARRAY]: convertStringArray,
  [WorkbookDataTypeEnum.NUMBER_ARRAY]: convertNumberArray,
  [WorkbookDataTypeEnum.MANAGED_ATTRIBUTES]: convertMap,
  [WorkbookDataTypeEnum.BOOLEAN_ARRAY]: convertBooleanArray,
  [WorkbookDataTypeEnum.DATE]: convertDate,
  [WorkbookDataTypeEnum.STRING]: (value) => value,
  [WorkbookDataTypeEnum.VOCABULARY]: (value) => value
};

export function useWorkbookConverter(
  mappingConfig: FieldMappingConfigType,
  entityName: string
) {
  const { apiClient, save } = useApiClient();
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
  const flattenedConfig = getFlattenedConfig(entityName);

  function getFlattenedConfig(eName: string) {
    const config = {};
    if (has(mappingConfig, entityName)) {
      const flattened = flattenObject(mappingConfig[eName]);
      for (const key of Object.keys(flattened)) {
        const lastPos = key.lastIndexOf(".");
        if (lastPos > -1) {
          const path = key.substring(0, lastPos);
          if (!path.endsWith(".relationshipConfig")) {
            const value = get(mappingConfig, eName + "." + path);
            config[path.replaceAll(".attributes.", ".")] = value;
          }
        } else {
          const path = key;
          const value = get(mappingConfig, eName + "." + path);
          config[path] = value;
        }
      }
    }
    return config;
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

  function getFieldDataType(fieldPath?: string) {
    return fieldPath ? flattenedConfig[fieldPath]?.dataType : undefined;
  }

  function getFieldRelationshipConfig(fieldPath?: string) {
    return fieldPath
      ? flattenedConfig[fieldPath]?.relationshipConfig
      : flattenedConfig.relationshipConfig;
  }

  function getFieldConverter(fieldPath?: string) {
    const fieldDataType = getFieldDataType(fieldPath);
    return !!fieldDataType
      ? DATATYPE_CONVERTER_MAPPING[fieldDataType]
      : undefined;
  }

  function convertWorkbook(
    workbookData: { [key: string]: any }[],
    group: string
  ): InputResource<
    KitsuResource & { group?: string } & {
      relationshipConfig: {
        type: string;
        hasGroup: boolean;
        tryToLinkExisting: boolean;
        baseApiPath?: string;
      };
      relationships: {
        [key: string]: {
          data: { id: string; type: string } | { id: string; type: string }[];
        };
      };
    }
  >[] {
    const resources: InputResource<
      KitsuResource & {
        group?: string;
        relationships: {
          [key: string]: {
            data: { id: string; type: string } | { id: string; type: string }[];
          };
        };
      }
    >[] = [];
    // loop throw all rows of the workbook data array
    for (const workbookRow of workbookData) {
      const resource: InputResource<
        KitsuResource & {
          group?: string;
          relationships: {
            [key: string]: {
              data:
                | { id: string; type: string }
                | { id: string; type: string }[];
            };
          };
        }
      > = {
        type: flattenedConfig.type,
        group,
        relationships: {}
      } as InputResource<KitsuResource & { group?: string }>;

      // The fieldNameInWorkbook can be a simple field name if it is unique in the configuration;
      // or a full name like 'organism.determination.verbatimScientificName'
      for (const fieldNameInWorkbook of Object.keys(workbookRow)) {
        // The fieldPath will be the full path, for example 'organism.determination.verbatimScientificName",
        // even the fieldNameInWorkbook is 'verbatimScientificName'
        const fieldPath = getPathOfField(fieldNameInWorkbook);
        if (fieldPath) {
          let parent = resource;
          const fieldNameArray = fieldPath.split(".");
          let childPath = "";
          for (let i = 0; i < fieldNameArray.length - 1; i++) {
            const childName = fieldNameArray[i];
            childPath =
              childPath === "" ? childName : childPath + "." + childName;
            const childDataType = getFieldDataType(childPath);
            const childRelationshipConfig =
              getFieldRelationshipConfig(childPath);
            let child: InputResource<
              KitsuResource & { group?: string } & {
                relationshipConfig: {
                  type: string;
                  hasGroup: boolean;
                  tryToLinkExisting: boolean;
                  baseApiPath?: string;
                };
              }
            >;
            if (childDataType === WorkbookDataTypeEnum.OBJECT) {
              child = parent[childName];
            } else {
              child = parent[childName] ? parent[childName][0] : undefined;
            }
            if (!child) {
              child = {} as InputResource<KitsuResource & { group?: string }>;
              if (childRelationshipConfig) {
                child.relationshipConfig = childRelationshipConfig;
              }
              if (childDataType === WorkbookDataTypeEnum.OBJECT) {
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
      resources.push(resource);
    }
    return resources;
  }

  async function linkRelationshipAttribute(
    resource: InputResource<
      KitsuResource & {
        group?: string;
        relationships: {
          [key: string]: {
            data: { id: string; type: string } | { id: string; type: string }[];
          };
        };
      }
    >,
    attributeName: string,
    group: string
  ) {
    const value = resource[attributeName];
    if (attributeName === "relationshipConfig") {
      resource.type = value.type;
      resource.relationships = {};
      if (value.hasGroup) {
        resource[group] = group;
      }
      delete resource.relationshipConfig;
    } else if (isObject(value)) {
      const relationshipConfig = value.relationshipConfig;
      // if the value is an object, traverse into properies of the object
      if (relationshipConfig) {
        if (relationshipConfig.tryToLinkExisting) {
          // find the fields that are simple data type
          const fields = Object.keys(value).filter((key) => {
            if (key === "relationshipConfig") {
              return false;
            }
            if (Array.isArray(value[key] || isObject(value[key]))) {
              return false;
            }
            return true;
          });
          const valueToLink = await apiClient
            .get(
              `${relationshipConfig.baseApiPath}/${relationshipConfig.type}`,
              {
                filter: {
                  ...pick(value, fields)
                }
              }
            )
            .then((response) =>
              response?.data
                ? {
                    id: response.data.id,
                    type: response.data.type
                  }
                : null
            );
          if (valueToLink) {
            if (!resource.relationships) {
              resource.relationships = {};
            }
            resource.relationships[attributeName] = {
              data: valueToLink
            };
            delete resource[attributeName];
            return;
          }
        }
        // if there is no existing record in the db, then create it
        for (const childName of Object.keys(value)) {
          await linkRelationshipAttribute(value, childName, group);
        }
        const valueForRelationship = await save(
          [
            {
              resource: value,
              type: relationshipConfig.type
            }
          ],
          { apiBaseUrl: relationshipConfig.baseApiPath }
        ).then((response) => ({ id: response[0].id, type: response[0].type }));
        if (!resource.relationships) {
          resource.relationships = {};
        }
        resource.relationships[attributeName] = { data: valueForRelationship };
        delete resource[attributeName];
        return;
      } else {
        for (const childName of Object.keys(value)) {
          await linkRelationshipAttribute(value, childName, group);
        }
      }
    } else if (Array.isArray(value) && value.length > 0) {
      const relationshipConfig = value[0].relationshipConfig;
      if (isObject(value[0])) {
        if (relationshipConfig) {
          if (relationshipConfig.tryToLinkExisting) {
            // find the fields that are simple data type
            const valuesForRelationship: { id: string; type: string }[] = [];
            for (const item of value) {
              const fields = Object.keys(item).filter((key) => {
                if (key === "relationshipConfig") {
                  return false;
                }
                if (Array.isArray(item[key] || isObject(item[key]))) {
                  return false;
                }
                return true;
              });
              const valueToLink = await apiClient
                .get(
                  `${relationshipConfig.baseApiPath}/${relationshipConfig.type}`,
                  {
                    filter: {
                      ...pick(item, fields)
                    }
                  }
                )
                .then((response) =>
                  response?.data
                    ? {
                        id: response.data.id,
                        type: response.data.type
                      }
                    : null
                );
              if (valueToLink) {
                valuesForRelationship.push(valueToLink);
              }
            }
            if (valuesForRelationship.length === value.length) {
              if (!resource.relationships) {
                resource.relationships = {};
              }
              resource.relationships[attributeName] = {
                data: valuesForRelationship
              };
              delete resource[attributeName];
              return;
            }
          }
        }
        // if there is no existing record in the db, then create it
        for (const item of value) {
          for (const childName of Object.keys(item)) {
            await linkRelationshipAttribute(item, childName, group);
          }
        }
        const valueForRelationship = await save(
          value.map((item) => ({
            resource: item,
            type: relationshipConfig.type
          })),
          { apiBaseUrl: relationshipConfig.baseApiPath }
        ).then((response) => response.map((rs) => pick(rs, ["id", "type"])));
        if (!resource.relationships) {
          resource.relationships = {};
        }
        resource.relationships[attributeName] = {
          data: valueForRelationship
        };
        delete resource[attributeName];
      }
    }
  }

  // async function saveData(
  //   resource: InputResource<
  //     KitsuResource & { group?: string } & {
  //       relationshipConfig: {
  //         type: string;
  //         hasGroup: boolean;
  //         tryToLinkExisting: boolean;
  //         baseApiPath?: string;
  //       };
  //     }
  //   >
  // ) {}

  return {
    linkRelationshipAttribute,
    convertWorkbook,
    flattenedConfig,
    getFieldConverter,
    getPathOfField,
    getFieldRelationshipConfig,
    saveData
  };
}
