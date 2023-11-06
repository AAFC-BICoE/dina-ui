import { useApiClient } from "common-ui";
import { InputResource, KitsuResource } from "kitsu";
import { filter, get, has, pick } from "lodash";
import { useRef } from "react";
import {
  FieldMappingConfigType,
  LinkOrCreateSetting,
  WorkbookDataTypeEnum
} from "..";
import {
  CollectingEventSelectField,
  CollectionSelectField
} from "../../resource-select-fields/resource-select-fields";
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
  const cache = useRef<Record<string, { id: string; type: string }>>({});

  /**
   * The data structure in the flatternedConfig is like this
   * {
   *    stringArrayField: { dataType: 'string[]' },
   *    vocabularyField: { dataType: 'vocabulary', vocabularyEndpoint: 'vocabulary endpoint' },
   *    objectField: {
   *      dataType: 'object',
   *      attributes: { name: [Object], age: [Object] }
   *      relationshipConfig: {
   *        baseApiPath: "fake-api",
   *        hasGroup: true,
   *        linkOrCreateSetting: LinkOrCreateSetting.LINK_OR_CREATE,
   *        type: "object-field"
   *      }
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

  function isFieldInALinkableRelationshipField(fieldPath: string) {
    if (fieldPath.includes(".")) {
      const lastIndex = fieldPath.lastIndexOf(".");
      const parentPath = fieldPath.substring(0, lastIndex);
      const parentConfig = flattenedConfig[parentPath];
      return (
        parentConfig.relationshipConfig &&
        (parentConfig.relationshipConfig.linkOrCreateSetting ===
          LinkOrCreateSetting.LINK ||
          parentConfig.relationshipConfig.linkOrCreateSetting ===
            LinkOrCreateSetting.LINK_OR_CREATE)
      );
    }
    return false;
  }

  function getItemFromCache(
    key: string
  ): { id: string; type: string } | undefined {
    return cache.current[key];
  }

  function putItemInCache(key: string, fieldValue) {
    cache.current[key] = fieldValue;
  }

  function getFieldDataType(fieldPath?: string): WorkbookDataTypeEnum {
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
        queryFields?: string[];
        linkOrCreateSetting: LinkOrCreateSetting;
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
                  queryFields?: string[];
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
        // We will use these properties to query from the database
        const fields = Object.keys(value).filter((fieldName) => {
          if (
            relationshipConfig.queryFields &&
            relationshipConfig.queryFields.length > 0 &&
            relationshipConfig.queryFields?.indexOf(fieldName) > -1
          )
            return true;
          else return false;
        });
        if (
          (!fields || fields.length === 0) &&
          (relationshipConfig.linkOrCreateSetting ===
            LinkOrCreateSetting.LINK ||
            relationshipConfig.linkOrCreateSetting ===
              LinkOrCreateSetting.LINK_OR_CREATE)
        ) {
          throw new Error(
            `Can not link or create "${attributeName}" with the missing fileds "${relationshipConfig.queryFields}"`
          );
        }
        const queryPath = `${relationshipConfig.baseApiPath}/${relationshipConfig.type}`;
        const queryFilter = { ...pick(value, fields) };
        const keyForCache = JSON.stringify({ path: queryPath, queryFilter });
        // If there are fields which name is in the queryFields list
        if (
          relationshipConfig.linkOrCreateSetting === LinkOrCreateSetting.LINK ||
          relationshipConfig.linkOrCreateSetting ===
            LinkOrCreateSetting.LINK_OR_CREATE
        ) {
          let valueToLink = getItemFromCache(keyForCache);
          if (!valueToLink) {
            // Query from dababase
            valueToLink = await apiClient
              .get(queryPath, { filter: queryFilter })
              .then((response) => {
                if (response?.data) {
                  if (Array.isArray(response.data)) {
                    if (response.data.length > 0) {
                      return pick(response.data[0], ["id", "type"]);
                    }
                  } else {
                    const valueFromDb = pick(response.data, ["id", "type"]);
                    putItemInCache(keyForCache, valueFromDb);
                    return valueFromDb;
                  }
                }
              });
          }
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
          const newCreatedValue = await save(
            [
              {
                resource: value,
                type: relationshipConfig.type
              }
            ],
            { apiBaseUrl: relationshipConfig.baseApiPath }
          ).then((response) => {
            const valueToLink = pick(response[0], ["id", "type"]);
            if (
              relationshipConfig.linkOrCreateSetting ===
              LinkOrCreateSetting.LINK_OR_CREATE
            ) {
              // If LINK or LINK_OR_CREATE, we need to put it in cache
              putItemInCache(keyForCache, valueToLink);
            }
            return valueToLink;
          });
          if (!resource.relationships) {
            resource.relationships = {};
          }
          if (newCreatedValue) {
            resource.relationships[attributeName] = {
              data: newCreatedValue
            };
          }
          delete resource[attributeName];
          return;
        }
      } else {
        for (const childName of Object.keys(value)) {
          await linkRelationshipAttribute(value, childName, group);
        }
      }
    } else if (Array.isArray(value) && value.length > 0) {
      const valuesForRelationship: { id: string; type: string }[] = [];
      for (const valueInArray of value) {
        const relationshipConfig = valueInArray.relationshipConfig;
        // If the value is an Object Array type, and there is a relationshipConfig defined
        // Then we need to loop through all properties of each item in the array
        if (isObject(valueInArray)) {
          if (relationshipConfig) {
            // The filter below is to find out all simple data type properties
            // We will use these properties to query from the database
            const fields = Object.keys(valueInArray).filter((fieldName) => {
              if (
                relationshipConfig.queryFields &&
                relationshipConfig.queryFields.length > 0 &&
                relationshipConfig.queryFields?.indexOf(fieldName) > -1
              )
                return true;
              else return false;
            });
            let valueToLink;
            if (
              (!fields || fields.length === 0) &&
              (relationshipConfig.linkOrCreateSetting ===
                LinkOrCreateSetting.LINK ||
                relationshipConfig.linkOrCreateSetting ===
                  LinkOrCreateSetting.LINK_OR_CREATE)
            ) {
              throw new Error(
                `Can not link or create "${attributeName}" with the missing fileds "${relationshipConfig.queryFields}"`
              );
            }
            // If there are fields which name is in the queryFields list
            const queryPath = `${relationshipConfig.baseApiPath}/${relationshipConfig.type}`;
            const queryFilter = { ...pick(valueInArray, fields) };
            const keyForCache = JSON.stringify({
              path: queryPath,
              queryFilter
            });

            if (
              relationshipConfig.linkOrCreateSetting ===
                LinkOrCreateSetting.LINK ||
              relationshipConfig.linkOrCreateSetting ===
                LinkOrCreateSetting.LINK_OR_CREATE
            ) {
              valueToLink = getItemFromCache(keyForCache);
              if (!valueToLink) {
                // query data from database
                valueToLink = await apiClient
                  .get(queryPath, { filter: queryFilter })
                  .then((response) => {
                    if (response?.data) {
                      if (Array.isArray(response.data)) {
                        if (response.data.length > 0) {
                          const valueFromDb = pick(response.data[0], [
                            "id",
                            "type"
                          ]);
                          putItemInCache(keyForCache, valueFromDb);
                          return valueFromDb;
                        }
                      } else {
                        const valueFromDb = pick(response.data, ["id", "type"]);
                        putItemInCache(keyForCache, valueFromDb);
                        return valueFromDb;
                      }
                    }
                  });
              }
              if (valueToLink) {
                valuesForRelationship.push(valueToLink);
              }
            }

            if (
              !valueToLink &&
              (relationshipConfig.linkOrCreateSetting ===
                LinkOrCreateSetting.CREATE ||
                relationshipConfig.linkOrCreateSetting ===
                  LinkOrCreateSetting.LINK_OR_CREATE)
            ) {
              // if there is no existing record in the db, then create it
              for (const childName of Object.keys(valueInArray)) {
                await linkRelationshipAttribute(valueInArray, childName, group);
              }

              const newCreatedValue = await save(
                [
                  {
                    resource: valueInArray,
                    type: relationshipConfig.type
                  }
                ],
                { apiBaseUrl: relationshipConfig.baseApiPath }
              ).then((response) => {
                const newValueToLink = pick(response[0], ["id", "type"]);
                if (
                  relationshipConfig.linkOrCreateSetting ===
                  LinkOrCreateSetting.LINK_OR_CREATE
                ) {
                  // If LINK or LINK_OR_CREATE, we need to put it in cache
                  putItemInCache(keyForCache, newValueToLink);
                }
                return newValueToLink;
              });
              if (newCreatedValue) {
                valuesForRelationship.push(newCreatedValue);
              }
            }
          }
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

  function getResourceSelectForRelationshipField(
    relationshipConfig,
    fieldName: string,
    value: string
  ) {
    const eleName = `relationshipMapping.${fieldName}.${value}`;
    switch (relationshipConfig.type) {
      case "collection":
        return <CollectionSelectField name={eleName} />;
      case "collecting-event":
        return <CollectingEventSelectField name={eleName} />;
    }
  }

  return {
    linkRelationshipAttribute,
    convertWorkbook,
    flattenedConfig,
    getFieldConverter,
    getPathOfField,
    getFieldRelationshipConfig,
    isFieldInALinkableRelationshipField,
    getResourceSelectForRelationshipField
  };
}
