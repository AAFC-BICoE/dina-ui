import { useApiClient } from "common-ui";
import { InputResource, KitsuResource } from "kitsu";
import _ from "lodash";
import { useMemo } from "react";
import {
  FieldMappingConfigType,
  getFlattenedConfig,
  LinkOrCreateSetting,
  WorkbookColumnMap,
  WorkbookDataTypeEnum
} from "..";
import { ScientificNameSource } from "../../../../dina-ui/types/collection-api";
import {
  CollectingEventSelectField,
  CollectionMethodSelectField,
  CollectionSelectField,
  PersonSelectField,
  PreparationMethodSelectField,
  PreparationTypeSelectField,
  ProjectSelectField,
  ProtocolSelectField,
  StorageUnitSelectField
} from "../../resource-select-fields/resource-select-fields";
import FieldMappingConfig from "./FieldMappingConfig";
import {
  convertBoolean,
  convertBooleanArray,
  convertDate,
  convertNumber,
  convertNumberArray,
  convertString,
  convertStringArray,
  getParentFieldPath,
  isEmptyWorkbookValue,
  isObject
} from "./workbookMappingUtils";
import { useDinaIntl } from "../../../intl/dina-ui-intl";

export const THRESHOLD_NUM_TO_SHOW_MAP_RELATIONSHIP = 10;

export function useWorkbookConverter(
  mappingConfig: FieldMappingConfigType,
  entityName: string
) {
  const { apiClient, save } = useApiClient();
  const { formatMessage } = useDinaIntl();

  const FIELD_TO_VOCAB_ELEMS_MAP = useMemo(() => {
    // Have to load end-points up front, save all responses in a map
    const fieldToVocabElemsMap = new Map();
    for (const recordType of Object.keys(FieldMappingConfig)) {
      const recordFieldsMap = FieldMappingConfig[recordType];
      for (const recordField of Object.keys(recordFieldsMap)) {
        const { dataType, endpoint } = recordFieldsMap[recordField];
        switch (dataType) {
          case WorkbookDataTypeEnum.VOCABULARY:
            if (endpoint) {
              apiClient.get(endpoint, {}).then((response) => {
                const vocabElements = (
                  response.data as any
                )?.vocabularyElements?.map((vocabElement) => vocabElement.name);
                fieldToVocabElemsMap.set(recordField, vocabElements);
              });
            }
            break;
          case WorkbookDataTypeEnum.ENUM:
            const allowedValues = (recordFieldsMap[recordField] as any)
              .allowedValues;
            fieldToVocabElemsMap.set(recordField, allowedValues);
          case WorkbookDataTypeEnum.MANAGED_ATTRIBUTES:
            if (endpoint) {
              // load available Managed Attributes
              apiClient
                .get(endpoint, { page: { limit: 1000 } })
                .then((response) => {
                  fieldToVocabElemsMap.set(recordField, response.data);
                });
            }
            break;
          default:
            break;
        }
      }
    }
    return fieldToVocabElemsMap;
  }, [entityName]);

  const DATATYPE_CONVERTER_MAPPING = {
    [WorkbookDataTypeEnum.NUMBER]: convertNumber,
    [WorkbookDataTypeEnum.BOOLEAN]: convertBoolean,
    [WorkbookDataTypeEnum.STRING_ARRAY]: convertStringArray,
    [WorkbookDataTypeEnum.NUMBER_ARRAY]: convertNumberArray,
    [WorkbookDataTypeEnum.MANAGED_ATTRIBUTES]: (
      value: any,
      _fieldName?: string
    ) => value,
    [WorkbookDataTypeEnum.BOOLEAN_ARRAY]: convertBooleanArray,
    [WorkbookDataTypeEnum.DATE]: convertDate,
    [WorkbookDataTypeEnum.STRING]: convertString,
    [WorkbookDataTypeEnum.STRING_COORDINATE]: (
      value: any,
      _fieldName?: string
    ) => convertString((value as string).toUpperCase(), _fieldName),
    [WorkbookDataTypeEnum.VOCABULARY]: (value: any, _fieldName?: string) =>
      value.toUpperCase().replace(" ", "_"),
    [WorkbookDataTypeEnum.ENUM]: (value: any, fieldName?: string) => {
      const allowedValues = FIELD_TO_VOCAB_ELEMS_MAP.get(fieldName || "");
      if (allowedValues) {
        const found = allowedValues.find(
          (ev) => ev.value === value || ev.label === value
        );
        if (found) {
          return found.value;
        }
      }
    },
    [WorkbookDataTypeEnum.CLASSIFICATION]: (value: {
      [key: string]: string;
    }) => {
      if (value) {
        return {
          classificationRanks: Object.keys(value).join("|"),
          classificationPath: Object.values(value).join("|")
        };
      } else {
        return {
          classificationRanks: undefined,
          classificationPath: undefined
        };
      }
    }
  };

  const flattenedConfig = getFlattenedConfig(mappingConfig, entityName);

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
      const filteredPaths = _.filter(fieldPaths, (item) =>
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
            LinkOrCreateSetting.LINK_OR_CREATE ||
          parentConfig.relationshipConfig.linkOrCreateSetting ===
            LinkOrCreateSetting.LINK_OR_ERROR)
      );
    }
    return false;
  }

  function getFieldDataType(
    fieldPath?: string
  ): WorkbookDataTypeEnum | undefined {
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

  /**
   * Convert workbook from the uploaded file into API resources, which are ready to call the API to save them.
   * @param workbookData
   * @param group
   * @returns
   */
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

          // Handle nested attributes
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
          // END of handle nested attributes
          const convertField = getFieldConverter(fieldPath);
          if (!!convertField) {
            parent[fieldNameArray[fieldNameArray.length - 1]] = convertField(
              workbookRow[fieldNameInWorkbook],
              fieldNameInWorkbook
            );
            if (
              fieldPath.includes("dwcDecimalLongitude") ||
              fieldPath.includes("dwcDecimalLatitude")
            ) {
              parent["isPrimary"] = true;
            }
            if (fieldPath === "organism.determination.scientificNameDetails") {
              parent["scientificNameSource"] = ScientificNameSource.CUSTOM;
            }
          }
        }
      }
      resources.push(resource);
    }
    return resources;
  }

  /**
   * search there is a columnMap for a attributeName. We can use this function
   * to check if there is a relationship mapping for an attribute. For example,
   * searchColumnMap('collection', filteredWorkbookColumnMap).  It will
   * return the following if there is a mpping for collection.
   *
   *   [{
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
   *   }]
   *
   * @param attributeName
   * @param filteredWorkbookColumnMap
   * @returns
   */
  function searchColumnMap(
    attributeName: string,
    workbookColumnMap: WorkbookColumnMap
  ):
    | {
        [fieldPath: string]: {
          [value: string]: {
            id: string;
            type: string;
          };
        };
      }
    | undefined {
    const foundMappings = Object.values(workbookColumnMap).filter((item) => {
      const fieldPath = item?.fieldPath;
      if (fieldPath) {
        const startIndex = fieldPath.indexOf(attributeName);
        const lastIndex = fieldPath.lastIndexOf(".");
        return fieldPath.substring(startIndex, lastIndex) === attributeName;
      } else {
        return false;
      }
    });
    if (foundMappings.length > 0) {
      return foundMappings.reduce((accu, curr) => {
        if (curr.fieldPath) {
          accu[curr.fieldPath] = curr.valueMapping;
        }
        return accu;
      }, {});
    } else {
      return undefined;
    }
  }

  function addNewValueToWorkbookColumnMap(
    fieldPath: string,
    value: any,
    newVal: { type: string; id: string },
    workbookColumnMap: WorkbookColumnMap
  ) {
    // add this newVal to filteredWorkbookColumnMap
    for (const attrNameInValue of Object.keys(value)) {
      const childFieldPath = fieldPath + "." + attrNameInValue;
      // if the number of unique values is less then THRESHOLD_NUM_TO_SHOW_MAP_RELATIONSHIP
      const colMap = workbookColumnMap[childFieldPath];
      if (
        colMap &&
        colMap.numOfUniqueValues < THRESHOLD_NUM_TO_SHOW_MAP_RELATIONSHIP
      ) {
        const childValue = value[attrNameInValue];
        if (childValue && !isObject(childValue) && !Array.isArray(childValue)) {
          workbookColumnMap[childFieldPath]!.valueMapping[
            value[attrNameInValue]
          ] = newVal;
        }
      }
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
    workbookColumnMap: WorkbookColumnMap,
    fieldPath: string,
    group: string
  ) {
    const attributeName = fieldPath.substring(fieldPath.lastIndexOf(".") + 1);
    const value = resource[attributeName];

    if (isEmptyWorkbookValue(value)) {
      delete resource[attributeName];
      return;
    }

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
        let valueToLink;
        if (
          relationshipConfig.linkOrCreateSetting === LinkOrCreateSetting.LINK ||
          relationshipConfig.linkOrCreateSetting ===
            LinkOrCreateSetting.LINK_OR_CREATE ||
          relationshipConfig.linkOrCreateSetting ===
            LinkOrCreateSetting.LINK_OR_ERROR
        ) {
          // get valueToLink from workbookColumnMap
          const columnMap = searchColumnMap(fieldPath, workbookColumnMap);
          if (columnMap) {
            for (const attrNameInValue of Object.keys(value)) {
              const childValue = value[attrNameInValue];
              if (
                childValue &&
                !isObject(childValue) &&
                !Array.isArray(childValue)
              ) {
                valueToLink =
                  columnMap[fieldPath + "." + attrNameInValue]?.[
                    childValue.trim().replaceAll(".", "_")
                  ];
                if (valueToLink) {
                  break;
                }
              }
            }
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
          } else {
            if (
              relationshipConfig.linkOrCreateSetting ===
              LinkOrCreateSetting.LINK
            ) {
              // if the field is link only, and there is no matching record, then ignore it.
              delete resource[attributeName];
              return;
            } else if (
              relationshipConfig.linkOrCreateSetting ===
              LinkOrCreateSetting.LINK_OR_ERROR
            ) {
              // if the field is LINK_OR_ERR, and there is no matching record, then throw new error.
              _.unset(value, "relationshipConfig");
              const notFoundValue = JSON.stringify(value);
              delete resource[attributeName];
              throw new Error(`${attributeName} not found: ${notFoundValue}`);
            }
          }
        }

        if (
          (!valueToLink &&
            relationshipConfig.linkOrCreateSetting ===
              LinkOrCreateSetting.CREATE) ||
          relationshipConfig.linkOrCreateSetting ===
            LinkOrCreateSetting.LINK_OR_CREATE
        ) {
          // if there is no mapping in workbookColumnMap, then create it
          for (const childName of Object.keys(value)) {
            await linkRelationshipAttribute(
              value,
              workbookColumnMap,
              fieldPath + "." + childName,
              group
            );
          }

          // Link storageUnit to storageUnitUsage before creating storageUnitUsage
          if (
            resource.type === "material-sample" &&
            attributeName === "storageUnitUsage"
          ) {
            // Check that storage unit is given if row has well column and well row
            if (
              !(resource as any)?.storageUnitUsage?.relationships?.storageUnit
                ?.data?.id
            ) {
              throw new Error(formatMessage("workBookStorageUnitIsRequired"));
            }

            // Supply the mandatory usage type.
            value["usageType"] = "material-sample";
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
            const newVal = _.pick(response[0], ["id", "type"]);
            addNewValueToWorkbookColumnMap(
              fieldPath,
              value,
              newVal,
              workbookColumnMap
            );
            return newVal;
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
            workbookColumnMap,
            fieldPath + "." + childName,
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
        if (relationshipConfig) {
          // The filter below is to find out all simple data type properties
          let valueToLink;
          if (
            relationshipConfig.linkOrCreateSetting ===
              LinkOrCreateSetting.LINK ||
            relationshipConfig.linkOrCreateSetting ===
              LinkOrCreateSetting.LINK_OR_CREATE ||
            relationshipConfig.linkOrCreateSetting ===
              LinkOrCreateSetting.LINK_OR_ERROR
          ) {
            // get valueToLink from workbookColumnMap
            const columnMap = searchColumnMap(fieldPath, workbookColumnMap);
            if (columnMap) {
              for (const attrNameInValue of Object.keys(valueInArray)) {
                const childValue = valueInArray[attrNameInValue];
                if (
                  childValue &&
                  !isObject(childValue) &&
                  !Array.isArray(childValue)
                ) {
                  valueToLink =
                    columnMap[fieldPath + "." + attrNameInValue]?.[
                      childValue.trim().replaceAll(".", "_")
                    ];

                  if (valueToLink) {
                    break;
                  }
                }
              }
            }
            if (valueToLink) {
              valuesForRelationship.push(
                ...(Array.isArray(valueToLink) ? valueToLink : [valueToLink])
              );
            } else {
              if (
                relationshipConfig.linkOrCreateSetting ===
                LinkOrCreateSetting.LINK
              ) {
                // if the field is link only, and there is no matching record, then ignore it.
                delete resource[attributeName];
                return;
              } else if (
                relationshipConfig.linkOrCreateSetting ===
                LinkOrCreateSetting.LINK_OR_ERROR
              ) {
                // if the field is LINK_OR_ERR, and there is no matching record, then throw new error.
                _.unset(value, "relationshipConfig");
                const notFoundValue = JSON.stringify(value);
                delete resource[attributeName];
                throw new Error(`${attributeName} not found: ${notFoundValue}`);
              }
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
                workbookColumnMap,
                fieldPath + "." + childName,
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
              const newVal = _.pick(response[0], ["id", "type"]);
              addNewValueToWorkbookColumnMap(
                fieldPath,
                valueInArray,
                newVal,
                workbookColumnMap
              );
              return newVal;
            });
            if (newCreatedValue) {
              valuesForRelationship.push(newCreatedValue);
            }
          }
        }
      }
      if (!resource.relationships) {
        resource.relationships = {};
      }
      if (valuesForRelationship.length) {
        resource.relationships[attributeName] = {
          data: valuesForRelationship
        };
        delete resource[attributeName];
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
    )}.${value.replaceAll(".", "_")}`;
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
      case "storage-unit":
        return <StorageUnitSelectField resourceProps={resourceSelectProps} />;
    }
  }

  return {
    linkRelationshipAttribute,
    searchColumnMap,
    convertWorkbook,
    flattenedConfig,
    getFieldConverter,
    getPathOfField,
    getFieldRelationshipConfig,
    isFieldInALinkableRelationshipField,
    getResourceSelectForRelationshipField,
    FIELD_TO_VOCAB_ELEMS_MAP
  };
}
