import { PersistedResource } from "kitsu";
import { chain, pick, startCase } from "lodash";
import { useEffect, useMemo, useState } from "react";
import {
  SelectField,
  filterBy,
  useAccount,
  useApiClient,
  useQuery
} from "../../../../common-ui/lib";
import { useDinaIntl } from "../../../intl/dina-ui-intl";
import {
  CollectingEvent,
  Collection,
  ManagedAttribute,
  MaterialSample,
  PreparationMethod,
  PreparationType,
  Project,
  Protocol,
  StorageUnit
} from "../../../types/collection-api";
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
  findMatchField,
  getColumnHeaders
} from "../utils/workbookMappingUtils";
import { FieldMapType } from "./WorkbookColumnMapping";

export function useColumnMapping(sheet: number, selectedType?: string) {
  const { formatMessage } = useDinaIntl();
  const { apiClient } = useApiClient();
  const {
    spreadsheetData,
    setColumnMap,
    workbookColumnMap,
    columnUniqueValues
  } = useWorkbookContext();

  const { flattenedConfig, getFieldRelationshipConfig } = useWorkbookConverter(
    FieldMappingConfig,
    selectedType || "material-sample"
  );

  // Retrieve a string array of the headers from the uploaded spreadsheet.
  const headers = useMemo(() => {
    return getColumnHeaders(spreadsheetData, sheet);
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
  const { isAdmin, groupNames } = useAccount();
  const groupFilter = !isAdmin
    ? {
        rsql: `group=in=(${groupNames})`
      }
    : undefined;

  const [fieldOptions, setFieldOptions] = useState<FieldOptionType[]>([]);
  const [fieldMap, setFieldMap] = useState<FieldMapType[]>([]);
  const [relationshipMapping, setRelationshipMapping] =
    useState<RelationshipMapping>();
  const { loading: attrLoading, response: attrResp } = useQuery<
    ManagedAttribute[]
  >({
    path: "collection-api/managed-attribute",
    filter: filterBy([], {
      extraFilters: [
        {
          selector: "managedAttributeComponent",
          comparison: "==",
          arguments: "MATERIAL_SAMPLE"
        }
      ]
    })("")
  });
  const { loading: collectionLoading, response: collectionResp } = useQuery<
    Collection[]
  >({
    path: "collection-api/collection",
    filter: groupFilter
  });
  const { loading: collEventLoading, response: collEventResp } = useQuery<
    CollectingEvent[]
  >({
    path: "collection-api/collecting-event",
    filter: groupFilter
  });
  const { loading: preparationTypeLoading, response: preparationTypeResp } =
    useQuery<PreparationType[]>({
      path: "collection-api/preparation-type",
      filter: groupFilter
    });
  const { loading: preparationMethodLoading, response: preparationMethodResp } =
    useQuery<PreparationMethod[]>({
      path: "collection-api/preparation-method",
      filter: groupFilter
    });
  const { loading: protocolLoading, response: protocolResp } = useQuery<
    Protocol[]
  >({
    path: "collection-api/protocol",
    filter: groupFilter
  });
  const { loading: storageUnitLoading, response: storageUnitResp } = useQuery<
    StorageUnit[]
  >({
    path: "collection-api/storage-unit",
    filter: groupFilter
  });
  const { loading: projectLoading, response: projectResp } = useQuery<
    Project[]
  >({
    path: "collection-api/project",
    filter: groupFilter
  });

  const loading =
    attrLoading ||
    collectionLoading ||
    collEventLoading ||
    preparationTypeLoading ||
    preparationMethodLoading ||
    protocolLoading ||
    storageUnitLoading ||
    projectLoading;

  const managedAttributes = attrResp?.data || [];
  const collections = collectionResp?.data || [];
  const collectingEvents = collEventResp?.data || [];
  const preparationTypes = preparationTypeResp?.data || [];
  const preparationMethods = preparationMethodResp?.data || [];
  const protocols = protocolResp?.data || [];
  const storageUnits = storageUnitResp?.data || [];
  const projects = projectResp?.data || [];

  useEffect(() => {
    async function generateFieldOptions() {
      if (!!selectedType) {
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
                  ? formatMessage(k as any).trim() || k.toUpperCase()
                  : label + (formatMessage(k as any).trim() || k.toUpperCase());
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
            const targetManagedAttr = managedAttributes.find(
              (item) =>
                item.name.toLowerCase().trim() ===
                columnHeader.toLowerCase().trim()
            );
            if (targetManagedAttr) {
              map.push({
                targetField: "managedAttributes",
                skipped: false,
                targetKey: targetManagedAttr
              });
            } else {
              map.push({
                targetField: fieldPath,
                skipped: fieldPath === undefined
              });
            }
          } else {
            map.push({
              targetField: fieldPath,
              skipped: fieldPath === undefined
            });
          }
        }
        setFieldMap(map);
        setFieldOptions(newFieldOptions);
        await initColumnMap(newFieldOptions);
      }
    }

    async function initColumnMap(theFieldOptions: FieldOptionType[]) {
      // Calculate the workbook column mapping based on the name of the spreadsheet column header name
      const newWorkbookColumnMap: WorkbookColumnMap = {};
      const newRelationshipMapping: RelationshipMapping = {};
      for (const columnHeader of headers || []) {
        const fieldPath = findMatchField(columnHeader, theFieldOptions);
        if (fieldPath === undefined || fieldPath === "managedAttributes") {
          const targetManagedAttr = managedAttributes.find(
            (item) =>
              item.name.toLowerCase().trim() ===
              columnHeader.toLowerCase().trim()
          );
          if (targetManagedAttr) {
            newWorkbookColumnMap[columnHeader] = {
              fieldPath: "managedAttributes",
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
              showOnUI: true,
              mapRelationship: false,
              numOfUniqueValues: Object.keys(
                columnUniqueValues?.[sheet]?.[columnHeader] ?? {}
              ).length,
              valueMapping: {}
            };
          }
        } else if (fieldPath?.startsWith("parentMaterialSample.")) {
          const valueMapping = await resolveParentMapping(
            columnHeader,
            fieldPath
          );
          newWorkbookColumnMap[columnHeader] = {
            fieldPath,
            showOnUI: false,
            mapRelationship: true,
            numOfUniqueValues: 1,
            valueMapping
          };
        } else {
          const mapRelationship =
            fieldPath.indexOf(".") > -1 &&
            flattenedConfig[fieldPath.substring(0, fieldPath.indexOf("."))]
              ?.relationshipConfig?.linkOrCreateSetting !==
              LinkOrCreateSetting.CREATE;
          newWorkbookColumnMap[columnHeader] = {
            fieldPath,
            showOnUI: true,
            mapRelationship,
            numOfUniqueValues: Object.keys(
              columnUniqueValues?.[sheet]?.[columnHeader] ?? {}
            ).length,
            valueMapping: {}
          };
          if (mapRelationship) {
            resolveRelationships(
              newRelationshipMapping,
              columnHeader,
              fieldPath
            );
          }
        }
      }
      setColumnMap(newWorkbookColumnMap);
      setRelationshipMapping(newRelationshipMapping);
      // End of workbook column mapping calculation
    }

    if (!loading) {
      generateFieldOptions();
    }
  }, [sheet, selectedType, loading]);

  /**
   * Resolve parentMaterialSample value mapping.
   * @param columnHeader the column header of parent material sample in the spreadsheet
   * @param fieldPath the mapped field path
   * @returns
   */
  async function resolveParentMapping(
    columnHeader: string,
    fieldPath: string
  ): Promise<{
    [value: string]: {
      id: string;
      type: string;
    };
  }> {
    const { type, baseApiPath } = getFieldRelationshipConfig();
    const lastDotPos = fieldPath.lastIndexOf(".");
    const fieldName = fieldPath.substring(lastDotPos + 1);
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
            const response = await apiClient.get<MaterialSample[]>(
              `${baseApiPath}/${type}?filter[${fieldName}]=${parentValue}`,
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
    const values = columnUniqueValues?.[sheet][columnHeader];
    if (values) {
      for (const value of Object.keys(values)) {
        let found: PersistedResource<any> | undefined;
        switch (fieldPath) {
          case "collection.name":
            found = collections.find((item) => item.name === value);
            break;
          case "preparationType.name":
            found = preparationTypes.find((item) => item.name === value);
            break;
          case "preparationMethod.name":
            found = preparationMethods.find((item) => item.name === value);
            break;
          case "preparationProtocol.name":
            found = protocols.find((item) => item.name === value);
            break;
          case "storageUnit.name":
            found = storageUnits.find((item) => item.name === value);
            break;
          case "projects.name":
            found = projects.find((item) => item.name === value);
            break;
        }
        if (found) {
          if (!theRelationshipMapping[columnHeader]) {
            theRelationshipMapping[columnHeader] = {};
          }
          theRelationshipMapping[columnHeader][value] = pick(found, [
            "id",
            "type"
          ]);
        }
      }
    }
    return relationshipMapping;
  }

  function getResourceSelectField(
    columnHeader: string,
    fieldPath?: string,
    fieldValue?: string
  ) {
    if (!fieldPath || !fieldValue) {
      return undefined;
    }
    const selectElemName = `relationshipMapping.${columnHeader
      .trim()
      .replaceAll(".", "_")}.${fieldValue}.id`;
    const hiddenElemName = `relationshipMapping.${columnHeader
      .trim()
      .replaceAll(".", "_")}.${fieldValue}.type`;
    let options: any[] = [];
    let targetType: string = "";
    switch (fieldPath) {
      case "storageUnit.name":
        options = storageUnits.map((resource) => ({
          label: resource.name,
          value: resource.id,
          resource
        }));
        targetType = "storage-unit";
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
      default:
        options = [];
    }
    return (
      <>
        <SelectField
          name={selectElemName}
          options={options}
          hideLabel={true}
          isMulti={false}
          selectProps={{
            isClearable: true,
            menuPortalTarget: document.body,
            styles: { menuPortal: (base) => ({ ...base, zIndex: 9999 }) }
          }}
        />
        <input type="hidden" name={hiddenElemName} value={targetType} />
      </>
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

    resolveParentMapping,
    getResourceSelectField
  };
}
