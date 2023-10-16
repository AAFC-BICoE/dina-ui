import { useApiClient } from "common-ui";
import { InputResource, KitsuResource } from "kitsu";
import { filter, get, has, pick } from "lodash";
import {
  FieldMappingConfigType,
  LinkOrCreateSetting,
  WorkbookDataTypeEnum
} from "..";
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
      : flattenedConfig["relationshipConfig"];
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
        type: flattenedConfig["type"],
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
                  linkOrCreateSetting: LinkOrCreateSetting;
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
        resource.group = group;
      }
      delete resource["relationshipConfig"];
    } else if (isObject(value) && attributeName !== "relationships") {
      const relationshipConfig = value.relationshipConfig;
      // if the value is an object, traverse into properies of the object
      if (relationshipConfig) {
        // If the value is an Object type, and there is a relationshipConfig defined
        // Then we need to loop through all properties of the value
        if (
          relationshipConfig.linkOrCreateSetting === LinkOrCreateSetting.LINK ||
          relationshipConfig.linkOrCreateSetting ===
            LinkOrCreateSetting.LINK_OR_CREATE
        ) {
          // The filter below is to find out all simple data type properties
          // We will use these properties to query from the database
          const fields = Object.keys(value).filter((key) => {
            if (key === "relationshipConfig") {
              return false;
            }
            if (Array.isArray(value[key] || isObject(value[key]))) {
              return false;
            }
            return true;
          });
          // Query from dababase
          const valueToLink = await apiClient
            .get(
              `${relationshipConfig.baseApiPath}/${relationshipConfig.type}`,
              {
                filter: {
                  ...pick(value, fields)
                }
              }
            )
            .then((response) => {
              if (response?.data) {
                if (Array.isArray(response.data)) {
                  if (response.data.length > 0) {
                    return pick(response.data[0], ["id", "type"]);
                  } else {
                    return null;
                  }
                } else {
                  return pick(response.data, ["id", "type"]);
                }
              } else {
                return null;
              }
            });
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
        if (
          relationshipConfig.linkOrCreateSetting ===
            LinkOrCreateSetting.CREATE ||
          relationshipConfig.linkOrCreateSetting ===
            LinkOrCreateSetting.LINK_OR_CREATE
        ) {
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
          ).then((response) => ({
            id: response[0].id,
            type: response[0].type
          }));
          if (!resource.relationships) {
            resource.relationships = {};
          }
          resource.relationships[attributeName] = {
            data: valueForRelationship
          };
          delete resource[attributeName];
          return;
        }
      } else {
        for (const childName of Object.keys(value)) {
          await linkRelationshipAttribute(value, childName, group);
        }
      }
    } else if (Array.isArray(value) && value.length > 0) {
      const relationshipConfig = value[0].relationshipConfig;
      if (isObject(value[0])) {
        if (relationshipConfig) {
          // If the value is an Object Array type, and there is a relationshipConfig defined
          // Then we need to loop through all properties of each item in the array
          if (
            relationshipConfig.linkOrCreateSetting ===
              LinkOrCreateSetting.LINK ||
            relationshipConfig.linkOrCreateSetting ===
              LinkOrCreateSetting.LINK_OR_CREATE
          ) {
            const valuesForRelationship: { id: string; type: string }[] = [];
            for (const item of value) {
              // The filter below is to find out all simple data type properties
              // We will use these properties to query from the database
              const fields = Object.keys(item).filter((key) => {
                if (key === "relationshipConfig") {
                  return false;
                }
                if (Array.isArray(item[key] || isObject(item[key]))) {
                  return false;
                }
                return true;
              });
              // query data from database
              const valueToLink = await apiClient
                .get(
                  `${relationshipConfig.baseApiPath}/${relationshipConfig.type}`,
                  {
                    filter: {
                      ...pick(item, fields)
                    }
                  }
                )
                .then((response) => {
                  if (response?.data) {
                    if (Array.isArray(response.data)) {
                      if (response.data.length > 0) {
                        return pick(response.data[0], ["id", "type"]);
                      } else {
                        return null;
                      }
                    } else {
                      return pick(response.data, ["id", "type"]);
                    }
                  } else {
                    return null;
                  }
                });
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

          if (
            relationshipConfig.linkOrCreateSetting ===
              LinkOrCreateSetting.CREATE ||
            relationshipConfig.linkOrCreateSetting ===
              LinkOrCreateSetting.LINK_OR_CREATE
          ) {
            // if there is no existing record in the db, then create it
            for (const item of value) {
              for (const childName of Object.keys(item)) {
                await linkRelationshipAttribute(item, childName, group);
              }
            }
            if (relationshipConfig) {
              const valueForRelationship = await save(
                value.map((item) => ({
                  resource: item,
                  type: relationshipConfig.type
                })),
                { apiBaseUrl: relationshipConfig.baseApiPath }
              ).then((response) =>
                response.map((rs) => pick(rs, ["id", "type"]))
              );
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
      }
    }
  }

  return {
    linkRelationshipAttribute,
    convertWorkbook,
    flattenedConfig,
    getFieldConverter,
    getPathOfField,
    getFieldRelationshipConfig
  };
}
