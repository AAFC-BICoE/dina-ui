import { FieldHeader, dateCell } from "..";
import {
  DynamicField,
  DynamicFieldsMappingConfig,
  ESIndexMapping,
  RelationshipDynamicField,
  TableColumn
} from "../list-page/types";
import Kitsu, { GetParams, KitsuResource } from "kitsu";
import { get } from "lodash";
import React from "react";
import { ManagedAttributeSearchStates } from "../list-page/query-builder/query-builder-value-types/QueryBuilderManagedAttributeSearch";
import { FieldExtensionSearchStates } from "../list-page/query-builder/query-builder-value-types/QueryBuilderFieldExtensionSearch";

export interface GenerateColumnPathProps {
  /** Index mapping for the column to generate the column path. */
  indexMapping: ESIndexMapping;

  /** Dynamic field value passed from the query builder managed attribute/field extension components */
  dynamicFieldValue?: string;
}

export function generateColumnPath({
  indexMapping,
  dynamicFieldValue
}: GenerateColumnPathProps) {
  // Handle the path for dynamic fields.
  if (indexMapping.dynamicField && dynamicFieldValue) {
    switch (indexMapping.dynamicField.type) {
      case "managedAttribute":
        const managedAttributeValues: ManagedAttributeSearchStates =
          JSON.parse(dynamicFieldValue);
        return (
          indexMapping.dynamicField.type +
          "/" +
          (indexMapping.dynamicField?.component ?? "ENTITY") +
          "/" +
          managedAttributeValues?.selectedManagedAttribute?.key
        );
      case "fieldExtension":
        const fieldExtensionValues: FieldExtensionSearchStates =
          JSON.parse(dynamicFieldValue);
        return (
          indexMapping.dynamicField.type +
          "/" +
          (indexMapping.dynamicField?.component ?? "ENTITY") +
          "/" +
          fieldExtensionValues?.selectedExtension +
          "/" +
          fieldExtensionValues?.selectedField
        );
    }
  }

  return indexMapping.value;
}

export interface GenerateColumnDefinitionProps<TData extends KitsuResource> {
  /** The index mapping for the field to be added. */
  indexMappings: ESIndexMapping[];

  /** Dynamic field mapping configuration. */
  dynamicFieldsMappingConfig?: DynamicFieldsMappingConfig;

  /** The path of the column to be generated. This is used to search against the index mappings. */
  path: string;

  /**
   * Preferred mappings to use instead of generating a new column.
   */
  defaultColumns?: TableColumn<TData>[];

  /**
   * API client to be used for generating the dynamic fields.
   */
  apiClient: Kitsu;
}

export async function generateColumnDefinition<TData extends KitsuResource>({
  indexMappings,
  dynamicFieldsMappingConfig,
  path,
  defaultColumns,
  apiClient
}: GenerateColumnDefinitionProps<TData>): Promise<
  TableColumn<TData> | undefined
> {
  // Link the path to a index mapping.
  const indexMapping = indexMappings.find(
    (mapping) => mapping.label === path || mapping.value === path
  );

  // Check if it's a dynamic field if it could not be found directly in the index mapping.
  if (!indexMapping || indexMapping?.dynamicField) {
    return await getDynamicFieldColumn(
      path,
      apiClient,
      dynamicFieldsMappingConfig
    );
  }

  // Check if it's a nested relationship.
  if (indexMapping.parentType) {
    // Check if it's mapped in the default columns, and just use that definition.
    const defaultColumnFound = defaultColumns?.find(
      (item) => item.id === indexMapping.value
    );
    if (defaultColumnFound) {
      return defaultColumnFound;
    }

    return getNestedColumn(indexMapping);
  } else {
    // Check if it's mapped in the default columns, and just use that definition.
    const defaultColumnFound = defaultColumns?.find(
      (item) => item.id === indexMapping.label
    );
    if (defaultColumnFound) {
      return defaultColumnFound;
    }

    return getEntityColumn(indexMapping);
  }
}

function getEntityColumn<TData extends KitsuResource>(
  indexColumn: ESIndexMapping
): TableColumn<TData> {
  if (indexColumn.type === "date") {
    return dateCell(
      indexColumn?.label,
      indexColumn?.value,
      undefined,
      true,
      indexColumn
    );
  } else {
    return {
      id: indexColumn.label,
      header: () => <FieldHeader name={indexColumn?.label} />,
      accessorKey: indexColumn?.value,
      isKeyword: indexColumn?.keywordMultiFieldSupport
    };
  }
}

function getNestedColumn<TData extends KitsuResource>(
  indexColumn: ESIndexMapping
): TableColumn<TData> {
  const accessorKey = `${indexColumn.parentPath}.${
    indexColumn.path.split(".")[0]
  }.${indexColumn.label}`;

  if (indexColumn.type === "date") {
    return dateCell(
      indexColumn.value,
      accessorKey,
      indexColumn.parentType,
      true,
      indexColumn
    );
  } else {
    return {
      id: indexColumn.value,
      header: () => <FieldHeader name={indexColumn.label} />,
      accessorKey,
      isKeyword: indexColumn.keywordMultiFieldSupport,
      isColumnVisible: true,
      cell: ({ row: { original } }) => {
        const relationshipAccessor = accessorKey?.split(".");
        relationshipAccessor?.splice(
          1,
          0,
          indexColumn.parentType ? indexColumn.parentType : ""
        );
        const valuePath = relationshipAccessor?.join(".");
        const value = get(original, valuePath);
        return <>{value}</>;
      },
      relationshipType: indexColumn.parentType
    };
  }
}

// Handle getting columns from query options that contain dynamicField
async function getDynamicFieldColumn<TData extends KitsuResource>(
  path: string,
  apiClient: Kitsu,
  dynamicFieldsMappingConfig?: DynamicFieldsMappingConfig
): Promise<TableColumn<TData> | undefined> {
  const pathParts = path.split("/");
  if (dynamicFieldsMappingConfig && pathParts.length > 0) {
    // Handle managed attribute paths.
    if (pathParts.length === 3 && pathParts[0] === "managedAttribute") {
      const component = pathParts[1];
      const key = pathParts[2];
      return getManagedAttributesColumn(
        component,
        key,
        apiClient,
        dynamicFieldsMappingConfig
      );
    }

    // Handle field extension paths.
    if (pathParts.length === 4 && pathParts[0] === "fieldExtension") {
      const component = pathParts[1];
      const extension = pathParts[2];
      const field = pathParts[3];
    }
  }

  // Unable to process path.
  return undefined;
}

async function getManagedAttributesColumn<TData extends KitsuResource>(
  component: string,
  key: string,
  apiClient: Kitsu,
  dynamicFieldsMappingConfig: DynamicFieldsMappingConfig
): Promise<TableColumn<TData> | undefined> {
  // API request params:
  const params = {
    filter: {
      managedAttributeComponent: component,
      key
    },
    page: { limit: 1 }
  };

  // Figure out API endpoint using the dynamicFieldsMappingConfig.
  const fieldConfigMatch = dynamicFieldsMappingConfig.fields.find(
    (config) =>
      config.type === "managedAttribute" && config.component === component
  );
  const relationshipConfigMatch =
    dynamicFieldsMappingConfig.relationshipFields.find(
      (config) =>
        config.type === "managedAttribute" && config.component === component
    );

  if (!fieldConfigMatch && !relationshipConfigMatch) {
    console.error(
      "Managed Attribute Config for the following component: " +
        component +
        " could not be determined."
    );
    return;
  }

  try {
    if (fieldConfigMatch) {
      // API request for the managed attribute.
      const managedAttribute = await fetchDynamicField(
        apiClient,
        fieldConfigMatch.apiEndpoint,
        params
      );

      if (managedAttribute[0]) {
        return getAttributesManagedAttributeColumn<TData>(
          managedAttribute[0],
          fieldConfigMatch
        );
      }
    }

    if (relationshipConfigMatch) {
      // API request for the managed attribute.
      const managedAttribute = await fetchDynamicField(
        apiClient,
        relationshipConfigMatch.apiEndpoint,
        params
      );
      if (managedAttribute[0]) {
        return getIncludedManagedAttributeColumn<TData>(
          managedAttribute[0],
          relationshipConfigMatch
        );
      }
    }
  } catch (error) {
    // Handle the error here, e.g., log it or display an error message.
    throw error;
  }

  return undefined;
}

export function getIncludedManagedAttributeColumn<TData extends KitsuResource>(
  managedAttribute: any,
  config: RelationshipDynamicField
): TableColumn<TData> {
  const managedAttributeKey = managedAttribute.key;
  const accessorKey = `${config.path}.${managedAttributeKey}`;

  const managedAttributesColumn = {
    cell: ({ row: { original } }) => {
      const relationshipAccessor = accessorKey?.split(".");
      relationshipAccessor?.splice(
        1,
        0,
        config.referencedType ? config.referencedType : ""
      );
      const valuePath = relationshipAccessor?.join(".");
      const value = get(original, valuePath);
      return <>{value}</>;
    },
    header: () => <FieldHeader name={managedAttribute.name} />,
    accessorKey,
    id: `${config.referencedBy}.${config.label}.${managedAttributeKey}`,
    isKeyword: managedAttribute.vocabularyElementType === "STRING",
    isColumnVisible: true,
    relationshipType: config.referencedType,
    managedAttribute,
    config
  };

  return managedAttributesColumn;
}

export function getAttributesManagedAttributeColumn<
  TData extends KitsuResource
>(managedAttribute: any, config: DynamicField): TableColumn<TData> {
  const managedAttributeKey = managedAttribute.key;
  const accessorKey = `${config.path}.${managedAttributeKey}`;
  const managedAttributesColumn = {
    header: () => <FieldHeader name={managedAttribute.name} />,
    accessorKey,
    id: `${config.label}.${managedAttributeKey}`,
    isKeyword: managedAttribute.vocabularyElementType === "STRING",
    isColumnVisible: true,
    config,
    managedAttribute,
    sortDescFirst: true
  };

  return managedAttributesColumn;
}

export function getAttributeExtensionFieldColumn<TData extends KitsuResource>(
  columnMapping: ESIndexMapping,
  extensionValue: any,
  extensionField: any
): TableColumn<TData> {
  const fieldExtensionResourceType = columnMapping.path.split(".").at(-1);
  const extensionValuesColumn = {
    accessorKey: `${columnMapping.path}.${extensionValue.id}.${extensionField.key}`,
    id: `${fieldExtensionResourceType}.${extensionValue.id}.${extensionField.key}`,
    header: () => `${extensionValue.extension.name} - ${extensionField.name}`,
    label: `${extensionValue.extension.name} - ${extensionField.name}`,
    isKeyword: columnMapping.keywordMultiFieldSupport,
    isColumnVisible: true,
    columnMapping,
    extensionValue,
    extensionField
  };

  return extensionValuesColumn;
}

// Fetch filtered dynamic field from back end
async function fetchDynamicField(apiClient: Kitsu, path, params?: GetParams) {
  const { data } = await apiClient.get(path, params ?? {});

  return data;
}

// Get attribute and included extension values columns
async function getExtensionValuesColumn<TData extends KitsuResource>(
  columnMapping: ESIndexMapping,
  apiClient: Kitsu,
  columnOptions: TableColumn<TData>[]
) {
  const params = {
    filter: {
      "extension.fields.dinaComponent":
        columnMapping.dynamicField?.component ?? ""
    },
    page: { limit: 1000 }
  };
  try {
    const extensionValues = await fetchDynamicField(
      apiClient,
      columnMapping.dynamicField?.apiEndpoint,
      params
    );
    if (columnMapping.parentType) {
      // Handle included extension values
      getIncludedExtensionValuesColumns(
        extensionValues,
        columnMapping,
        columnOptions
      );
    } else {
      // getAttributesExtensionValuesColumns(
      //  extensionValues,
      //  columnMapping,
      //  columnOptions
      // );
    }
  } catch (error) {
    // Handle the error here, e.g., log it or display an error message.
    throw error;
  }
}

// Get included Extension Values column from ES field
function getIncludedExtensionValuesColumns<TData extends KitsuResource>(
  extensionValues,
  columnMapping: ESIndexMapping,
  columnOptions: TableColumn<TData>[]
) {
  const totalIncludedExtensionValuesCols: TableColumn<TData>[] = [].concat(
    ...extensionValues?.map((extensionValue) =>
      getIncludedExtensionValuesColumn(extensionValue, columnMapping)
    )
  );

  columnOptions.push(...totalIncludedExtensionValuesCols);
}

function getIncludedExtensionValuesColumn(
  extensionValue: any,
  columnMapping: ESIndexMapping
) {
  const extensionFields = extensionValue.extension.fields;
  const includedExtensionValuesColumns = extensionFields?.map(
    (extensionField) =>
      getIncludedExtensionFieldColumn(
        columnMapping,
        extensionValue,
        extensionField
      )
  );
  return includedExtensionValuesColumns;
}

export function getIncludedExtensionFieldColumn(
  columnMapping: ESIndexMapping,
  extensionValue: any,
  extensionField: any
) {
  const fieldExtensionResourceType = columnMapping.path.split(".").at(-1);
  const accessorKey = `${columnMapping.path}.${extensionValue.id}.${extensionField.key}`;
  const extensionValuesColumn = {
    cell: ({ row: { original } }) => {
      const relationshipAccessor = accessorKey?.split(".");
      relationshipAccessor?.splice(
        1,
        0,
        columnMapping.parentType ? columnMapping.parentType : ""
      );
      const valuePath = relationshipAccessor?.join(".");
      const value = get(original, valuePath);
      return <>{value}</>;
    },
    accessorKey,
    id: `${columnMapping.parentName}.${fieldExtensionResourceType}.${extensionValue.id}.${extensionField.key}`,
    header: () => `${extensionValue.extension.name} - ${extensionField.name}`,
    label: `${extensionValue.extension.name} - ${extensionField.name}`,
    isKeyword: columnMapping.keywordMultiFieldSupport,
    isColumnVisible: true,
    relationshipType: columnMapping.parentType,
    columnMapping,
    extensionValue,
    extensionField
  };

  return extensionValuesColumn;
}
