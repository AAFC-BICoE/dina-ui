import { PersistedResource } from "kitsu";
import { chain, pick, startCase } from "lodash";
import { useEffect, useMemo, useState } from "react";
import {
  SelectField,
  Tooltip,
  filterBy,
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
import { WorkbookDataTypeEnum } from "../types/WorkbookDataTypeEnum";
import FieldMappingConfig from "../utils/FieldMappingConfig";
import { useWorkbookConverter } from "../utils/useWorkbookConverter";
import {
  FieldOptionType,
  compareAlphanumeric,
  findMatchField,
  getColumnHeaders
} from "../utils/workbookMappingUtils";
import { FieldMapType } from "./WorkbookColumnMapping";
import { Person } from "../../../types/agent-api/resources/Person";
import { FaExclamationTriangle } from "react-icons/fa";
import { ResourceNameIdentifier } from "../../../types/common/resources/ResourceNameIdentifier";

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

  // Generate sheet dropdown options
  const sheetOptions = useMemo(() => {
    if (spreadsheetData) {
      return Object.entries(spreadsheetData).map(([sheetNumberString, _]) => {
        const sheetNumber = +sheetNumberString;
        // This label is hardcoded for now, it will eventually be replaced with the sheet name in a
        // future ticket.
        return { label: "Sheet " + (sheetNumber + 1), value: sheetNumber };
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
    filter: filterBy([], {
      extraFilters: [
        {
          selector: "managedAttributeComponent",
          comparison: "=in=",
          arguments: ["MATERIAL_SAMPLE", "PREPARATION", "COLLECTING_EVENT"]
        }
      ]
    })(""),
    page: { limit: 1000 }
  });

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

  const managedAttributes = [...(attrRespMaterialSample?.data ?? [])];
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
    columnHeader = columnHeader.replace(".", "_");

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
    columnHeader = columnHeader.replace(".", "_");

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

  async function resolveColumnMappingAndRelationshipMapping(
    columnHeader: string,
    fieldPath?: string
  ) {
    const originalColumnHeader = columnHeader;
    columnHeader = columnHeader.replace(".", "_");

    const newWorkbookColumnMap: WorkbookColumnMap = {};
    const newRelationshipMapping: RelationshipMapping = {};
    if (fieldPath === undefined) {
      if (
        managedAttributes.findIndex(
          (item) =>
            item.name.toLowerCase().trim() === columnHeader.toLowerCase().trim()
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
            columnHeader.toLowerCase().trim()
        ) > -1
      ) {
        handleClassificationMapping(originalColumnHeader, newWorkbookColumnMap);
      }
    } else if (fieldPath === "organism.determination.scientificNameDetails") {
      handleClassificationMapping(originalColumnHeader, newWorkbookColumnMap);
    } else if (fieldPath === "managedAttributes") {
      handleManagedAttributeMapping(originalColumnHeader, newWorkbookColumnMap);
    } else if (fieldPath?.startsWith("parentMaterialSample.")) {
      const valueMapping = await resolveParentMapping(columnHeader);
      newWorkbookColumnMap[columnHeader] = {
        fieldPath,
        originalColumnName: originalColumnHeader,
        showOnUI: false,
        mapRelationship: true,
        numOfUniqueValues: 1,
        valueMapping
      };
    } else {
      const mapRelationship =
        // Check if there's a dot in the fieldPath
        fieldPath.lastIndexOf(".") > -1 &&
        // Extract everything except the last dot
        flattenedConfig[fieldPath.substring(0, fieldPath.lastIndexOf("."))]
          ?.relationshipConfig?.linkOrCreateSetting ===
          LinkOrCreateSetting.LINK;

      newWorkbookColumnMap[columnHeader] = {
        fieldPath,
        originalColumnName: originalColumnHeader,
        showOnUI: true,
        mapRelationship,
        numOfUniqueValues: Object.keys(
          columnUniqueValues?.[sheet]?.[columnHeader] ?? {}
        ).length,
        valueMapping: {}
      };

      if (mapRelationship) {
        resolveRelationships(newRelationshipMapping, columnHeader, fieldPath);
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
      const fieldPath = findMatchField(columnHeader, theFieldOptions);
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
    const nonNestedRowOptions: { label: string; value: string }[] = [];
    const nestedRowOptions: {
      label: string;
      value: string;
      parentPath: string;
    }[] = [];
    // const newFieldOptions: { label: string; value: string }[] = [];
    Object.keys(flattenedConfig).forEach((fieldPath) => {
      if (fieldPath === "relationshipConfig") {
        return;
      }
      const config = flattenedConfig[fieldPath];
      if (
        config.dataType !== WorkbookDataTypeEnum.OBJECT &&
        config.dataType !== WorkbookDataTypeEnum.OBJECT_ARRAY
      ) {
        // Handle creating options for nested path for dropdown component
        if (fieldPath.includes(".")) {
          const lastIndex = fieldPath.lastIndexOf(".");
          const parentPath = fieldPath.substring(0, lastIndex);
          const labelPath = fieldPath.substring(lastIndex + 1);
          const label =
            formatMessage(fieldPath as any)?.trim() ||
            formatMessage(`field_${labelPath}` as any)?.trim() ||
            formatMessage(labelPath as any)?.trim() ||
            startCase(labelPath);
          const option = {
            label,
            value: fieldPath,
            parentPath
          };
          nestedRowOptions.push(option);
        } else {
          // Handle creating options for non nested path for dropdown component
          const label =
            formatMessage(`field_${fieldPath}` as any)?.trim() ||
            formatMessage(fieldPath as any)?.trim() ||
            startCase(fieldPath);
          const option = {
            label,
            value: fieldPath
          };
          nonNestedRowOptions.push(option);
        }
      }
    });
    nonNestedRowOptions.sort((a, b) => a.label.localeCompare(b.label));

    // Using the parent name, group the relationships into sections.
    const groupedNestRowOptions = chain(nestedRowOptions)
      .groupBy((prop) => prop.parentPath)
      .map((group, key) => {
        const keyArr = key.split(".");
        let label: string | undefined;
        for (let i = 0; i < keyArr.length; i++) {
          const k = keyArr[i];
          label =
            label === undefined
              ? formatMessage(k as any).trim() || startCase(k)
              : label + (formatMessage(k as any).trim() || startCase(k));
          if (i < keyArr.length - 1) {
            label = label + ".";
          }
        }

        return {
          label: label!,
          options: group
        };
      })
      .sort((a, b) => a.label.localeCompare(b.label))
      .value();

    const newFieldOptions = nonNestedRowOptions
      ? [...nonNestedRowOptions, ...groupedNestRowOptions]
      : [];
    const map: FieldMapType[] = [];
    for (const columnHeader of headers || []) {
      const fieldPath = findMatchField(columnHeader, newFieldOptions);
      if (fieldPath === undefined) {
        // check if the columnHeader is one of managedAttributes
        const targetManagedAttr = managedAttributes.find(
          (item) =>
            item.name.toLowerCase().trim() === columnHeader.toLowerCase().trim()
        );
        // check if the columnHeader is one of taxonomicRankss
        const targetTaxonomicRank = taxonomicRanks.find(
          (item) =>
            item.name?.toLowerCase().trim() ===
            columnHeader.toLowerCase().trim()
        );
        if (targetManagedAttr) {
          if (
            targetManagedAttr.managedAttributeComponent === "MATERIAL_SAMPLE"
          ) {
            map.push({
              targetField: "managedAttributes",
              skipped: false,
              targetKey: targetManagedAttr,
              columnHeader
            });
          } else if (
            targetManagedAttr.managedAttributeComponent === "PREPARATION"
          ) {
            map.push({
              targetField: "preparationManagedAttributes",
              skipped: false,
              targetKey: targetManagedAttr,
              columnHeader
            });
          } else if (
            targetManagedAttr.managedAttributeComponent === "COLLECTING_EVENT"
          ) {
            map.push({
              targetField: "collectingEvent.managedAttributes",
              skipped: false,
              targetKey: targetManagedAttr,
              columnHeader
            });
          }
        } else if (targetTaxonomicRank) {
          map.push({
            targetField: "organism.determination.scientificNameDetails",
            skipped: false,
            targetKey: targetTaxonomicRank,
            columnHeader
          });
        } else {
          map.push({
            targetField: fieldPath,
            skipped: false,
            columnHeader
          });
        }
      } else {
        map.push({
          targetField: fieldPath,
          skipped: false,
          columnHeader
        });
      }
    }
    setFieldMap(map);
    setFieldOptions(newFieldOptions);
    await initColumnMap(newFieldOptions);
    setLoading(false);
  }

  useEffect(() => {
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
    [value: string]: {
      id: string;
      type: string;
    };
  }> {
    const valueMapping: {
      [value: string]: {
        id: string;
        type: string;
      };
    } = {};
    if (spreadsheetData) {
      const spreadsheetHeaders = spreadsheetData[sheet][0].content;
      const colIndex = spreadsheetHeaders.indexOf(columnHeader) ?? -1;
      if (colIndex > -1) {
        for (let i = 1; i < spreadsheetData[sheet].length; i++) {
          const parentValue = spreadsheetData[sheet][i].content[colIndex];
          if (parentValue) {
            const response = await apiClient.get<ResourceNameIdentifier[]>(
              `/collection-api/resource-name-identifier?filter[group][EQ]=${groupName}&filter[type][EQ]=material-sample&filter[name][EQ]=${parentValue}`,
              {
                page: { limit: 1 }
              }
            );
            if (response && response.data.length > 0) {
              valueMapping[parentValue] = { id: response.data[0].id, type };
            }
          }
        }
      }
    }
    return valueMapping;
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
              storageUnits.find((item) =>
                compareAlphanumeric(item.name, value)
              );

            break;
          case "projects.name":
            found =
              projects.find((item) => item.name === value) ??
              projects.find((item) => compareAlphanumeric(item.name, value));
            break;
          case "collectingEvent.collectors.displayName":
          case "preparedBy.displayName":
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

        // If relationship is found, set it. If not, reset it so it's empty.
        if (found) {
          theRelationshipMapping[columnHeader][value.replace(".", "_")] = pick(
            found,
            ["id", "type"]
          );
        }
      }
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

    const selectElemName = `relationshipMapping.${columnHeader.replaceAll(
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
        <SelectField
          className="flex-fill"
          name={selectElemName}
          options={options}
          hideLabel={true}
          isMulti={false}
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
    sheetOptions,
    taxonomicRanks,

    resolveParentMapping,
    resolveColumnMappingAndRelationshipMapping,
    getResourceSelectField
  };
}
