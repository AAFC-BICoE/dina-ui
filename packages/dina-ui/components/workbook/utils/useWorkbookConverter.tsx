import { useApiClient } from "common-ui";
import { InputResource, KitsuResource } from "kitsu";
import { filter, get, has, pick } from "lodash";
import { useRef } from "react";
import {
  FieldMappingConfigType,
  LinkOrCreateSetting,
  WorkbookColumnMap,
  WorkbookDataTypeEnum
} from "..";
import {
  CollectingEventSelectField,
  CollectionMethodSelectField,
  CollectionSelectField,
  PersonSelectField,
  PreparationMethodSelectField,
  PreparationTypeSelectField,
  ProjectSelectField,
  ProtocolSelectField
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
  getParentFieldPath,
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
   *      relationshipConfig: {
            baseApiPath: "fake-api",
            hasGroup: true,
            linkOrCreateSetting: LinkOrCreateSetting.LINK_OR_CREATE,
            type: "object-field"
          }
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
        type: flattenedConfig["relationshipConfig"]["type"],
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

  /**
   * filter the workbookColumnMap and generate a pure relationshi map like this
   *    {
   *      "collectingEvent.collectors.displayName": {
   *        "collector 3": {
   *          "id": "70875e43-c5e1-4381-bd20-f41aa88a0052",
   *          "type": "person"
   *        },
   *        "collector 2": {
   *          "id": "70875e43-c5e1-4381-bd20-f41aa88a0052",
   *          "type": "person"
   *        },
   *        "collector 1": {
   *          "id": "86c65bc9-ff2d-440d-8c63-3b6f928b2b69",
   *          "type": "person"
   *        }
   *       },
   *      "collection.name": {
   *        "coll1": {
   *          "id": "06a0cf94-9c77-4ec3-a8c1-f7a8ea3ce304",
   *          "type": "collection"
   *        },
   *        "coll2": {
   *          "id": "633dcb70-81c0-4c36-821b-4f5d8740615d",
   *          "type": "collection"
   *        },
   *        "coll3": {
   *          "id": "633dcb70-81c0-4c36-821b-4f5d8740615d",
   *          "type": "collection"
   *        }
   *      }
   *    }
   * 
   */
  function filterWorkbookColumnMap(workbookColumnMap: WorkbookColumnMap) {
    const filteredWorkbookColumnMap: {
      [fieldPath: string]: { [value: string]: { id: string; type: string } };
    } = {};

    const filtered = Object.values(workbookColumnMap).filter(
      (item) => item && item.mapRelationship === true
    );
    filtered.forEach((item) => {
      filteredWorkbookColumnMap[item!.fieldPath] = item!.valueMapping;
    });
    return filteredWorkbookColumnMap;
  }

  /**
   * search there is a columnMap for a attributeName. We can use this function 
   * to check if there is a relationship mapping for an attribute. For example,
   * searchColumnMap('collection', filteredWorkbookColumnMap).  It will 
   * return the following if there is a mpping for collection.
   * 
   *   {
   *     "coll1": {
   *       "id": "06a0cf94-9c77-4ec3-a8c1-f7a8ea3ce304",
   *       "type": "collection"
   *     },
   *     "coll2": {
   *       "id": "633dcb70-81c0-4c36-821b-4f5d8740615d",
   *       "type": "collection"
   *     },
   *     "coll3": {
   *       "id": "633dcb70-81c0-4c36-821b-4f5d8740615d",
   *       "type": "collection"
   *     }
   *   }
   * 
   * @param attributeName 
   * @param filteredWorkbookColumnMap 
   * @returns 
   */
  function searchColumnMap(
    attributeName: string,
    filteredWorkbookColumnMap: ReturnType<typeof filterWorkbookColumnMap>
  ): {[value: string]: {id: string, type: string}} | undefined {
    const foundFieldPath = Object.keys(filteredWorkbookColumnMap).find(
      (fieldPath) => {
        const lastIndex = fieldPath.lastIndexOf(".");
        return fieldPath.substring(0, lastIndex) === attributeName;
      }
    );
    if (foundFieldPath) {
      return filteredWorkbookColumnMap[foundFieldPath];
    }
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
    filteredWorkbookColumnMap: ReturnType<typeof filterWorkbookColumnMap>,
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
      // if the value is an object, traverse into properies of the object
      const relationshipConfig = value.relationshipConfig;
      if (relationshipConfig) {
        // If the value is an Object type, and there is a relationshipConfig defined
        if (
          relationshipConfig.linkOrCreateSetting === LinkOrCreateSetting.LINK ||
          relationshipConfig.linkOrCreateSetting ===
            LinkOrCreateSetting.LINK_OR_CREATE
        ) {
          let valueToLink;
          const columnMap = searchColumnMap(attributeName, filteredWorkbookColumnMap);
          if (columnMap) {
            valueToLink = columnMap[value]
          }
          // TODO: get valueToLink from workbookColumnMap

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
            await linkRelationshipAttribute(
              value,
              filteredWorkbookColumnMap,
              childName,
              group
            );
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
            return pick(response[0], ["id", "type"]);
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
          await linkRelationshipAttribute(
            value,
            filteredWorkbookColumnMap,
            childName,
            group
          );
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
            let valueToLink;
            if (
              relationshipConfig.linkOrCreateSetting ===
                LinkOrCreateSetting.LINK ||
              relationshipConfig.linkOrCreateSetting ===
                LinkOrCreateSetting.LINK_OR_CREATE
            ) {
              // TODO: get valueToLink from workbookColumnMap
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
                await linkRelationshipAttribute(
                  valueInArray,
                  filteredWorkbookColumnMap,
                  childName,
                  group
                );
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
                return pick(response[0], ["id", "type"]);
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
    columnName: string,
    fieldPath: string,
    value: string,
    onChange: (newValue: any) => void
  ) {
    const parentPath = getParentFieldPath(fieldPath);
    const relationshipConfig = getFieldRelationshipConfig(parentPath);
    const eleName = `relationshipMapping.${columnName.replaceAll(
      ".",
      "_"
    )}.${value}`;
    const resourceSelectProps = {
      hideLabel: true,
      selectProps: { isClearable: true },
      cannotBeChanged: false,
      name: eleName,
      onChange
    };
    switch (relationshipConfig?.type) {
      case "collection":
        return <CollectionSelectField {...resourceSelectProps} />;
      case "collecting-event":
        return <CollectingEventSelectField {...resourceSelectProps} />;
      case "person":
        return <PersonSelectField {...resourceSelectProps} />;
      case "collection-method":
        return <CollectionMethodSelectField {...resourceSelectProps} />;
      case "protocol":
        return <ProtocolSelectField {...resourceSelectProps} />;
      case "preparation-type":
        return <PreparationTypeSelectField {...resourceSelectProps} />;
      case "preparation-method":
        return <PreparationMethodSelectField {...resourceSelectProps} />;
      case "project":
        return <ProjectSelectField {...resourceSelectProps} />;
    }
  }

  return {
    linkRelationshipAttribute,
    filterWorkbookColumnMap,
    searchColumnMap,
    convertWorkbook,
    flattenedConfig,
    getFieldConverter,
    getPathOfField,
    getFieldRelationshipConfig,
    isFieldInALinkableRelationshipField,
    getResourceSelectForRelationshipField
  };
}
