import { PersistedResource } from "kitsu";
import _ from "lodash";
import { useEffect, useMemo, useState } from "react";
import {
  SelectField,
  SimpleSearchFilterBuilder,
  Tooltip,
  useApiClient,
  useQuery
} from "../../../../common-ui/lib";
import { useDinaIntl } from "../../../intl/dina-ui-intl";
import { ManagedAttribute, Vocabulary } from "../../../types/collection-api";
import { useWorkbookContext } from "../WorkbookProvider";
import {
  LinkOrCreateSetting,
  RelationshipMapping,
  WorkbookColumnMap
} from "../types/Workbook";
import FieldMappingConfig from "../utils/FieldMappingConfig";
import { useWorkbookConverter } from "../utils/useWorkbookConverter";
import {
  FieldOptionType,
  PERSON_SELECT_FIELDS,
  WorkbookColumnInfo,
  compareAlphanumeric,
  findMatchField,
  generateWorkbookFieldOptions,
  getColumnHeaders,
  validateTemplateIntegrity
} from "../utils/workbookMappingUtils";
import { FieldMapType } from "./WorkbookColumnMapping";
import { Person } from "../../../types/agent-api/resources/Person";
import { FaExclamationTriangle } from "react-icons/fa";
import { ResourceNameIdentifier } from "../../../types/common/resources/ResourceNameIdentifier";
import { PersonSelectField } from "../../resource-select-fields/resource-select-fields";

export function useColumnMapping() {
  const { formatMessage } = useDinaIntl();
  const { apiClient } = useApiClient();
  const {
    spreadsheetData,
    setColumnMap,
    setRelationshipMapping,
    workbookColumnMap,
    relationshipMapping,
    columnUniqueValues,
    sheet,
    type,
    group: groupName
  } = useWorkbookContext();

  const { flattenedConfig } = useWorkbookConverter(FieldMappingConfig, type);

  // Retrieve a string array of the headers from the uploaded spreadsheet.
  const headers = useMemo(() => {
    return getColumnHeaders(spreadsheetData, sheet ?? 0);
  }, [sheet]);

  // Determine if the template provided has been altered.
  const templateIntegrityWarning = useMemo<boolean>(() => {
    if (headers === null) {
      return true;
    }

    return validateTemplateIntegrity(headers);
  }, [headers]);

  // Generate sheet dropdown options
  const sheetOptions = useMemo(() => {
    if (spreadsheetData) {
      return Object.entries(spreadsheetData).map(([sheetNumberString, _]) => {
        const sheetNumber = +sheetNumberString;
        return {
          label: spreadsheetData[sheetNumber].sheetName,
          value: sheetNumber
        };
      });
    } else {
      return [];
    }
  }, [spreadsheetData]);

  const [fieldOptions, setFieldOptions] = useState<FieldOptionType[]>([]);
  const [fieldMap, setFieldMap] = useState<FieldMapType[]>([]);

  const {
    loading: attrLoadingMaterialSample,
    response: attrRespMaterialSample
  } = useQuery<ManagedAttribute[]>({
    path: "collection-api/managed-attribute",
    filter: SimpleSearchFilterBuilder.create<ManagedAttribute>()
      .where("managedAttributeComponent", "IN", [
        "MATERIAL_SAMPLE",
        "PREPARATION",
        "COLLECTING_EVENT"
      ])
      .build(),
    page: { limit: 1000 }
  });

  const { loading: attrLoadingMetadata, response: attrRespMetadata } = useQuery<
    ManagedAttribute[]
  >(
    {
      path: "objectstore-api/managed-attribute",
      page: { limit: 1000 }
    },
    {
      disabled: type !== "metadata"
    }
  );

  const { loading: taxonomicRankLoading, response: taxonomicRankResp } =
    useQuery<Vocabulary>({
      path: "collection-api/vocabulary2/taxonomicRank",
      page: { limit: 1000 }
    });

  const { loading: assemblageLoading, response: assemblageResp } = useQuery<
    ResourceNameIdentifier[]
  >(
    {
      path: `collection-api/resource-name-identifier?filter[group][EQ]=${groupName}&filter[type][EQ]=assemblage`,
      page: { limit: 1000 }
    },
    {
      deps: [groupName]
    }
  );

  const { loading: collectionLoading, response: collectionResp } = useQuery<
    ResourceNameIdentifier[]
  >(
    {
      path: `collection-api/resource-name-identifier?filter[group][EQ]=${groupName}&filter[type][EQ]=collection`,
      page: { limit: 1000 }
    },
    {
      deps: [groupName]
    }
  );
  const { loading: preparationTypeLoading, response: preparationTypeResp } =
    useQuery<ResourceNameIdentifier[]>(
      {
        path: `collection-api/resource-name-identifier?filter[group][EQ]=${groupName}&filter[type][EQ]=preparation-type`,
        page: { limit: 1000 }
      },
      {
        deps: [groupName]
      }
    );
  const { loading: preparationMethodLoading, response: preparationMethodResp } =
    useQuery<ResourceNameIdentifier[]>(
      {
        path: `collection-api/resource-name-identifier?filter[group][EQ]=${groupName}&filter[type][EQ]=preparation-method`,
        page: { limit: 1000 }
      },
      {
        deps: [groupName]
      }
    );
  const { loading: protocolLoading, response: protocolResp } = useQuery<
    ResourceNameIdentifier[]
  >(
    {
      path: `collection-api/resource-name-identifier?filter[group][EQ]=${groupName}&filter[type][EQ]=protocol`,
      page: { limit: 1000 }
    },
    {
      deps: [groupName]
    }
  );
  const { loading: storageUnitLoading, response: storageUnitResp } = useQuery<
    ResourceNameIdentifier[]
  >(
    {
      path: `collection-api/resource-name-identifier?filter[group][EQ]=${groupName}&filter[type][EQ]=storage-unit`,
      page: { limit: 1000 }
    },
    {
      deps: [groupName]
    }
  );
  const { loading: projectLoading, response: projectResp } = useQuery<
    ResourceNameIdentifier[]
  >(
    {
      path: `collection-api/resource-name-identifier?filter[group][EQ]=${groupName}&filter[type][EQ]=project`,
      page: { limit: 1000 }
    },
    {
      deps: [groupName]
    }
  );
  const { loading: personLoading, response: personResp } = useQuery<Person[]>({
    path: `agent-api/person`,
    page: { limit: 1000 }
  });
  const { loading: metadataLoading, response: metadataResp } = useQuery<
    ResourceNameIdentifier[]
  >(
    {
      path: `objectstore-api/resource-name-identifier?filter[group][EQ]=${groupName}&filter[type][EQ]=metadata`,
      page: { limit: 1000 }
    },
    {
      deps: [groupName]
    }
  );

  const loadingData =
    attrLoadingMaterialSample ||
    attrLoadingMetadata ||
    assemblageLoading ||
    collectionLoading ||
    preparationTypeLoading ||
    preparationMethodLoading ||
    protocolLoading ||
    storageUnitLoading ||
    projectLoading ||
    personLoading ||
    taxonomicRankLoading ||
    metadataLoading;

  const managedAttributes = [
    ...(attrRespMaterialSample?.data ?? []),
    ...(attrRespMetadata?.data ?? [])
  ];
  const taxonomicRanks = taxonomicRankResp?.data?.vocabularyElements || [];
  const assemblages = (assemblageResp?.data || []).map((item) => ({
    ...item,
    type: "assemblage"
  }));
  const collections = (collectionResp?.data || []).map((item) => ({
    ...item,
    type: "collection"
  }));
  const preparationTypes = (preparationTypeResp?.data || []).map((item) => ({
    ...item,
    type: "preparation-type"
  }));
  const preparationMethods = (preparationMethodResp?.data || []).map(
    (item) => ({ ...item, type: "preparation-method" })
  );
  const protocols = (protocolResp?.data || []).map((item) => ({
    ...item,
    type: "protocol"
  }));
  const storageUnits = (storageUnitResp?.data || []).map((item) => ({
    ...item,
    type: "storage-unit"
  }));
  const projects = (projectResp?.data || []).map((item) => ({
    ...item,
    type: "project"
  }));
  const persons = (personResp?.data || []).map((item) => ({
    ...item,
    type: "person"
  }));
  const metadatas = (metadataResp?.data || []).map((item) => ({
    ...item,
    type: "metadata"
  }));

  const [loading, setLoading] = useState<boolean>(loadingData);

  function handleManagedAttributeMapping(
    columnHeader: string,
    newWorkbookColumnMap: WorkbookColumnMap
  ) {
    const originalColumnHeader = columnHeader;
    columnHeader = columnHeader.replaceAll(".", "_");

    const fieldPath = "managedAttributes";
    const targetManagedAttr = managedAttributes.find(
      (item) =>
        item.name.toLowerCase().trim() === columnHeader.toLowerCase().trim()
    );

    if (targetManagedAttr) {
      newWorkbookColumnMap[columnHeader] = {
        fieldPath,
        originalColumnName: originalColumnHeader,
        showOnUI: true,
        mapRelationship: false,
        numOfUniqueValues: Object.keys(
          columnUniqueValues?.[sheet]?.[columnHeader] ?? {}
        ).length,
        valueMapping: {
          columnHeader: {
            id: targetManagedAttr.id,
            type: targetManagedAttr.type
          }
        }
      };
    } else {
      newWorkbookColumnMap[columnHeader] = {
        fieldPath,
        originalColumnName: originalColumnHeader,
        showOnUI: true,
        mapRelationship: false,
        numOfUniqueValues: Object.keys(
          columnUniqueValues?.[sheet]?.[columnHeader] ?? {}
        ).length,
        valueMapping: {}
      };
    }
  }

  function handleClassificationMapping(
    columnHeader: string,
    newWorkbookColumnMap: WorkbookColumnMap
  ) {
    const originalColumnHeader = columnHeader;
    columnHeader = columnHeader.replaceAll(".", "_");

    const fieldPath = "organism.determination.scientificNameDetails";
    const targetTaxonomicRank = taxonomicRanks.find(
      (item) =>
        item.name?.toLowerCase().trim() === columnHeader.toLowerCase().trim()
    );
    if (targetTaxonomicRank) {
      newWorkbookColumnMap[columnHeader] = {
        fieldPath,
        originalColumnName: originalColumnHeader,
        showOnUI: true,
        mapRelationship: false,
        numOfUniqueValues: Object.keys(
          columnUniqueValues?.[sheet]?.[columnHeader] ?? {}
        ).length,
        valueMapping: {
          columnHeader: {
            key: targetTaxonomicRank.key,
            name: targetTaxonomicRank.name
          }
        }
      };
    } else {
      newWorkbookColumnMap[columnHeader] = {
        fieldPath,
        originalColumnName: originalColumnHeader,
        showOnUI: true,
        mapRelationship: false,
        numOfUniqueValues: Object.keys(
          columnUniqueValues?.[sheet]?.[columnHeader] ?? {}
        ).length,
        valueMapping: {}
      };
    }
  }

  /**
   * Using the original column header, determine the managed attribute if possible.
   *
   * @param originalColumnHeader must be in a path format.
   * @returns managed attribute or undefined.
   */
  function findManagedAttributeMatchFromTemplate(
    originalColumnHeader: string
  ): PersistedResource<ManagedAttribute> | undefined {
    const parts = originalColumnHeader.split(".");
    if (parts.length === 0) {
      // Not in the correct path format. Assuming not a managed attribute path.
      return undefined;
    }

    // Last part is always the key for the managed attribute.
    const key = parts.at(-1);
    const path = parts.slice(0, -1).join(".");

    const config = flattenedConfig[path];
    if (!config) {
      // Assuming not a managed attribute, could not find configuration.
      return undefined;
    }

    return managedAttributes.find(
      (managedAttribute) =>
        managedAttribute.key === key &&
        (config.managedAttributeComponent === "ENTITY" ||
          managedAttribute.managedAttributeComponent ===
            config.managedAttributeComponent)
    );
  }

  async function resolveColumnMappingAndRelationshipMapping(
    columnHeader: WorkbookColumnInfo,
    fieldPath?: string
  ) {
    const columnHeaderValue = (
      columnHeader.originalColumn ?? columnHeader.columnHeader
    ).replaceAll(".", "_");
    const originalColumnHeader =
      columnHeader.originalColumn ?? columnHeader.columnHeader;

    const newWorkbookColumnMap: WorkbookColumnMap = {};
    const newRelationshipMapping: RelationshipMapping = {};
    if (fieldPath === undefined) {
      const templateManagedAttribute =
        findManagedAttributeMatchFromTemplate(originalColumnHeader);
      if (templateManagedAttribute) {
        newWorkbookColumnMap[columnHeaderValue] = {
          fieldPath:
            originalColumnHeader?.split?.(".")?.slice?.(0, -1)?.join?.(".") ??
            originalColumnHeader,
          originalColumnName: originalColumnHeader,
          showOnUI: true,
          mapRelationship: false,
          numOfUniqueValues: Object.keys(
            columnUniqueValues?.[sheet]?.[columnHeaderValue] ?? {}
          ).length,
          valueMapping: {
            columnHeader: {
              id: templateManagedAttribute.id,
              type: templateManagedAttribute.type
            }
          }
        };
      } else if (
        managedAttributes.findIndex(
          (item) =>
            item.name.toLowerCase().trim() ===
            columnHeaderValue.toLowerCase().trim()
        ) > -1
      ) {
        handleManagedAttributeMapping(
          originalColumnHeader,
          newWorkbookColumnMap
        );
      } else if (
        taxonomicRanks.findIndex(
          (item) =>
            item.name?.toLowerCase().trim() ===
            columnHeaderValue.toLowerCase().trim()
        ) > -1
      ) {
        handleClassificationMapping(originalColumnHeader, newWorkbookColumnMap);
      }
    } else if (fieldPath === "organism.determination.scientificNameDetails") {
      handleClassificationMapping(originalColumnHeader, newWorkbookColumnMap);
    } else if (fieldPath === "managedAttributes") {
      handleManagedAttributeMapping(originalColumnHeader, newWorkbookColumnMap);
    } else if (fieldPath?.startsWith("parentMaterialSample")) {
      const { valueMapping, multipleValueMappings } =
        await resolveParentMapping(originalColumnHeader);

      newWorkbookColumnMap[columnHeaderValue] = {
        fieldPath,
        originalColumnName: originalColumnHeader,
        showOnUI: false,
        mapRelationship: true,
        numOfUniqueValues: 1,
        valueMapping,
        multipleValueMappings
      };
    } else {
      const mapRelationship =
        // Check if there's a dot in the fieldPath
        fieldPath.lastIndexOf(".") > -1 &&
        // Extract everything except the last dot
        flattenedConfig[fieldPath.substring(0, fieldPath.lastIndexOf("."))]
          ?.relationshipConfig?.linkOrCreateSetting ===
          LinkOrCreateSetting.LINK;

      newWorkbookColumnMap[columnHeaderValue] = {
        fieldPath,
        originalColumnName: originalColumnHeader,
        showOnUI: true,
        mapRelationship,
        numOfUniqueValues: Object.keys(
          columnUniqueValues?.[sheet]?.[columnHeaderValue] ?? {}
        ).length,
        valueMapping: {}
      };

      if (mapRelationship) {
        resolveRelationships(
          newRelationshipMapping,
          columnHeaderValue,
          fieldPath
        );
      }
    }
    return {
      newWorkbookColumnMap,
      newRelationshipMapping
    };
  }

  async function initColumnMap(theFieldOptions: FieldOptionType[]) {
    // Calculate the workbook column mapping based on the name of the spreadsheet column header name
    const newWorkbookColumnMap: WorkbookColumnMap = {};
    const newRelationshipMapping: RelationshipMapping = {};
    for (const columnHeader of headers || []) {
      const fieldPath = findMatchField(columnHeader, theFieldOptions, type);
      const result = await resolveColumnMappingAndRelationshipMapping(
        columnHeader,
        fieldPath
      );
      Object.assign(newWorkbookColumnMap, result.newWorkbookColumnMap);
      Object.assign(newRelationshipMapping, result.newRelationshipMapping);
    }

    setColumnMap(newWorkbookColumnMap);
    setRelationshipMapping(newRelationshipMapping);
    // End of workbook column mapping calculation
  }

  async function generateFieldOptions() {
    setLoading(true);
    const newFieldOptions = generateWorkbookFieldOptions(
      flattenedConfig,
      formatMessage
    );

    const map: FieldMapType[] = [];
    for (const columnHeader of headers || []) {
      const columnHeaderValue =
        columnHeader.originalColumn ?? columnHeader.columnHeader;
      const fieldPath = findMatchField(columnHeader, newFieldOptions, type);
      if (fieldPath === undefined) {
        // check if the columnHeaderValue is one of managedAttributes
        const targetManagedAttr =
          findManagedAttributeMatchFromTemplate(columnHeaderValue) ??
          managedAttributes.find(
            (item) =>
              item.name.toLowerCase().trim() ===
              columnHeaderValue.toLowerCase().trim()
          );

        // check if the columnHeaderValue is one of taxonomicRankss
        const targetTaxonomicRank = taxonomicRanks.find(
          (item) =>
            item.name?.toLowerCase().trim() ===
            columnHeaderValue.toLowerCase().trim()
        );
        if (targetManagedAttr) {
          if (
            targetManagedAttr.managedAttributeComponent === "MATERIAL_SAMPLE"
          ) {
            map.push({
              targetField: "managedAttributes",
              skipped: false,
              targetKey: targetManagedAttr,
              columnHeader: columnHeader.columnHeader,
              originalColumn: columnHeader.originalColumn
            });
          } else if (
            targetManagedAttr.managedAttributeComponent === "PREPARATION"
          ) {
            map.push({
              targetField: "preparationManagedAttributes",
              skipped: false,
              targetKey: targetManagedAttr,
              columnHeader: columnHeader.columnHeader,
              originalColumn: columnHeader.originalColumn
            });
          } else if (
            targetManagedAttr.managedAttributeComponent === "COLLECTING_EVENT"
          ) {
            map.push({
              targetField: "collectingEvent.managedAttributes",
              skipped: false,
              targetKey: targetManagedAttr,
              columnHeader: columnHeader.columnHeader,
              originalColumn: columnHeader.originalColumn
            });
          } else {
            map.push({
              targetField: "managedAttributes",
              skipped: false,
              targetKey: targetManagedAttr,
              columnHeader: columnHeader.columnHeader,
              originalColumn: columnHeader.originalColumn
            });
          }
        } else if (targetTaxonomicRank) {
          map.push({
            targetField: "organism.determination.scientificNameDetails",
            skipped: false,
            targetKey: targetTaxonomicRank,
            columnHeader: columnHeader.columnHeader,
            originalColumn: columnHeader.originalColumn
          });
        } else {
          map.push({
            targetField: fieldPath,
            skipped: false,
            columnHeader: columnHeader.columnHeader,
            originalColumn: columnHeader.originalColumn
          });
        }
      } else {
        map.push({
          targetField: fieldPath,
          skipped: false,
          columnHeader: columnHeader.columnHeader,
          originalColumn: columnHeader.originalColumn
        });
      }
    }
    setFieldMap(map);
    setFieldOptions(newFieldOptions);
    await initColumnMap(newFieldOptions);
    setLoading(false);
  }

  useEffect(() => {
    // Clear mappings first
    setColumnMap({});
    setRelationshipMapping({});
    setFieldMap([]);
    setFieldOptions([]);

    // Then regenerate if data is ready
    if (!loadingData) {
      generateFieldOptions();
    }
  }, [sheet, type, groupName, loadingData]);

  /**
   * Resolve parentMaterialSample value mapping.
   * @param columnHeader the column header of parent material sample in the spreadsheet
   * @param fieldPath the mapped field path
   * @returns
   */
  async function resolveParentMapping(columnHeader: string): Promise<{
    valueMapping: {
      [value: string]: {
        id: string;
        type: string;
      };
    };
    multipleValueMappings?: {
      [value: string]: {
        id: string;
        type: string;
      }[];
    };
  }> {
    const valueMapping: {
      [value: string]: {
        id: string;
        type: string;
      };
    } = {};

    const multipleValueMappings: {
      [value: string]: {
        id: string;
        type: string;
      }[];
    } = {};

    if (spreadsheetData) {
      const spreadsheetHeaders =
        spreadsheetData?.[sheet]?.originalColumns ??
        spreadsheetData?.[sheet]?.rows?.[0]?.content;
      const colIndex = spreadsheetHeaders?.indexOf(columnHeader) ?? -1;

      if (colIndex > -1) {
        for (let i = 1; i < spreadsheetData[sheet].rows.length; i++) {
          const parentValue = spreadsheetData[sheet].rows[i].content[colIndex];
          if (parentValue) {
            const response = await apiClient.get<ResourceNameIdentifier[]>(
              `/collection-api/resource-name-identifier?filter[group][EQ]=${groupName}&filter[type][EQ]=material-sample&filter[name][EQ]=${parentValue}`,
              {
                page: { limit: 1 }
              }
            );
            if (response && response.data.length > 0) {
              valueMapping[parentValue] = { id: response.data[0].id, type };

              if (response.data.length > 1) {
                multipleValueMappings[parentValue] = response.data.map(
                  (resource) => ({
                    id: resource.id,
                    type
                  })
                );
              }
            }
          }
        }
      }
    }

    return { valueMapping, multipleValueMappings };
  }

  function resolveRelationships(
    theRelationshipMapping: RelationshipMapping,
    columnHeader: string,
    fieldPath: string
  ) {
    theRelationshipMapping[columnHeader] = {};
    const values = columnUniqueValues?.[sheet][columnHeader];

    if (values) {
      for (const value of Object.keys(values)) {
        // Find initial relationship value without string splitting
        const found: PersistedResource<any> | undefined =
          getInitialRelationshipFieldValues(value);
        // If relationship is found, set it. If not, reset it so it's empty.
        if (found) {
          if (PERSON_SELECT_FIELDS.has(fieldPath)) {
            theRelationshipMapping[columnHeader][value.replaceAll(".", "_")] = [
              _.pick(found, ["id", "type"])
            ];
          } else {
            theRelationshipMapping[columnHeader][value.replaceAll(".", "_")] =
              _.pick(found, ["id", "type"]);
          }
        } else {
          // No value was found without string splitting
          // Now try to find values with string splitting
          const relationshipMappingDefaultValues: {
            id: string;
            type: string;
          }[] = [];
          if (PERSON_SELECT_FIELDS.has(fieldPath)) {
            const splitFieldValues = value
              .split(";")
              .map((item) => item.trim());
            for (const fieldValue of splitFieldValues) {
              const initialRelationshipFieldValue:
                | PersistedResource<any>
                | undefined = getInitialRelationshipFieldValues(fieldValue);
              if (initialRelationshipFieldValue) {
                relationshipMappingDefaultValues.push(
                  _.pick(initialRelationshipFieldValue, ["id", "type"])
                );
              }
            }
            theRelationshipMapping[columnHeader][value.replaceAll(".", "_")] =
              relationshipMappingDefaultValues;
          }
        }
      }
    }

    function getInitialRelationshipFieldValues(value: string) {
      let found: PersistedResource<any> | undefined;
      switch (fieldPath) {
        case "assemblages.name":
          found =
            assemblages.find((item) => item.name === value) ??
            assemblages.find((item) => compareAlphanumeric(item.name, value));
          break;
        case "collection.name":
          found =
            collections.find((item) => item.name === value) ??
            collections.find((item) => compareAlphanumeric(item.name, value));
          break;
        case "preparationType.name":
          found =
            preparationTypes.find((item) => item.name === value) ??
            preparationTypes.find((item) =>
              compareAlphanumeric(item.name, value)
            );
          break;
        case "preparationMethod.name":
          found =
            preparationMethods.find((item) => item.name === value) ??
            preparationMethods.find((item) =>
              compareAlphanumeric(item.name, value)
            );
          break;
        case "preparationProtocol.name":
          found =
            protocols.find((item) => item.name === value) ??
            protocols.find((item) => compareAlphanumeric(item.name, value));
          break;
        case "storageUnitUsage.storageUnit.name":
          found =
            storageUnits.find((item) => item.name === value) ??
            storageUnits.find((item) => compareAlphanumeric(item.name, value));
          break;
        case "projects.name":
          found =
            projects.find((item) => item.name === value) ??
            projects.find((item) => compareAlphanumeric(item.name, value));
          break;
        case "collectingEvent.collectors.displayName":
        case "preparedBy.displayName":
        case "dcCreator.displayName":
          found =
            persons.find((item) => item.displayName === value) ??
            persons.find((item) =>
              compareAlphanumeric(item.displayName, value)
            );
          break;
        case "attachment.name":
          found =
            metadatas.find((item) => item.name === value) ??
            metadatas.find((item) => compareAlphanumeric(item.name, value));
          break;
      }
      return found;
    }
  }

  function getResourceSelectField(
    onChangeRelatedRecord: (
      columnHeader: string,
      fieldValue: string,
      relatedRecord: string,
      targetType: string
    ) => void,
    columnHeader: string,
    fieldPath?: string,
    fieldValue?: string
  ) {
    if (!fieldPath || !fieldValue) {
      return undefined;
    }

    const selectElemName = PERSON_SELECT_FIELDS.has(fieldPath)
      ? `relationshipMapping.${columnHeader.replaceAll(
          ".",
          "_"
        )}.${fieldValue.replaceAll(".", "_")}`
      : `relationshipMapping.${columnHeader.replaceAll(
          ".",
          "_"
        )}.${fieldValue.replaceAll(".", "_")}.id`;

    let options: any[] = [];
    let targetType: string = "";
    switch (fieldPath) {
      case "storageUnitUsage.storageUnit.name":
        options = storageUnits.map((resource) => ({
          label: resource.name,
          value: resource.id,
          resource
        }));
        targetType = "storage-unit";
        break;
      case "assemblages.name":
        options = assemblages.map((resource) => ({
          label: resource.name,
          value: resource.id,
          resource
        }));
        targetType = "assemblage";
        break;
      case "collection.name":
        options = collections.map((resource) => ({
          label: resource.name,
          value: resource.id,
          resource
        }));
        targetType = "collection";
        break;
      case "preparationType.name":
        options = preparationTypes.map((resource) => ({
          label: resource.name,
          value: resource.id,
          resource
        }));
        targetType = "preparation-type";
        break;
      case "preparationMethod.name":
        options = preparationMethods.map((resource) => ({
          label: resource.name,
          value: resource.id,
          resource
        }));
        targetType = "preparation-method";
        break;
      case "preparationProtocol.name":
        options = protocols.map((resource) => ({
          label: resource.name,
          value: resource.id,
          resource
        }));
        targetType = "protocol";
        break;
      case "projects.name":
        options = projects.map((resource) => ({
          label: resource.name,
          value: resource.id,
          resource
        }));
        targetType = "project";
        break;
      case "collectingEvent.collectors.displayName":
      case "preparedBy.displayName":
      case "dcCreator.displayName":
        options = persons.map((resource) => ({
          label: resource.displayName,
          value: resource.id,
          resource
        }));
        targetType = "person";
        break;
      case "attachment.name":
        options = metadatas.map((resource) => ({
          label: resource.name,
          value: resource.id,
          resource
        }));
        targetType = "metadata";
        break;
      default:
        options = [];
    }

    // Find duplicate resources to warn the user
    const seen = new Set();
    const duplicateResources: string[] = [];
    options.forEach((option) => {
      if (seen.has(option.label)) {
        duplicateResources.push(option.label);
      } else {
        seen.add(option.label);
      }
    });
    const hasDuplicatesResources = duplicateResources.length > 0;
    const duplicateResourcesSelected = duplicateResources.includes(fieldValue);
    const showDuplicateWarningTooltip =
      hasDuplicatesResources && duplicateResourcesSelected;

    return (
      <div className="d-flex">
        {PERSON_SELECT_FIELDS.has(fieldPath) ? (
          <PersonSelectField
            onChange={(newValue) => {
              onChangeRelatedRecord(
                columnHeader,
                fieldValue,
                (newValue as any)?.map((person) => person.id),
                targetType
              );
            }}
            className="flex-fill"
            name={selectElemName}
            hideLabel={true}
            isMulti={true}
            selectProps={{
              isClearable: true,
              menuPortalTarget: document.body,
              styles: {
                menuPortal: (base) => ({ ...base, zIndex: 9999 })
              }
            }}
          />
        ) : (
          <SelectField
            className="flex-fill"
            name={selectElemName}
            options={options}
            hideLabel={true}
            selectProps={{
              isClearable: true,
              menuPortalTarget: document.body,
              styles: {
                menuPortal: (base) => ({ ...base, zIndex: 9999 })
              }
            }}
            onChange={(newValue) => {
              onChangeRelatedRecord(
                columnHeader,
                fieldValue,
                newValue as string,
                targetType
              );
            }}
          />
        )}
        {showDuplicateWarningTooltip && (
          <Tooltip
            disableSpanMargin={true}
            className="mt-3 ms-1"
            visibleElement={
              <div className="card pill py-1 px-2 d-flex flex-row align-items-center gap-1 label-default label-outlined bg-warning">
                <FaExclamationTriangle />
              </div>
            }
            directText={formatMessage("duplicateResourcesFound", {
              duplicateResources: duplicateResources.join(", ")
            })}
          />
        )}
      </div>
    );
  }

  return {
    loading,
    workbookColumnMap,
    relationshipMapping,
    fieldMap,
    fieldOptions,
    headers,
    templateIntegrityWarning,
    sheetOptions,
    taxonomicRanks,

    resolveParentMapping,
    resolveColumnMappingAndRelationshipMapping,
    getResourceSelectField
  };
}
