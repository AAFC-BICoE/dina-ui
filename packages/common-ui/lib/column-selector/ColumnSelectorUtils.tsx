import { FieldHeader, dateCell } from "..";
import { ESIndexMapping, TableColumn } from "../list-page/types";
import Kitsu, { GetParams, KitsuResource } from "kitsu";
import { get } from "lodash";
import React from "react";

export interface GenerateColumnDefinitionProps<TData extends KitsuResource> {
  /** The index mapping for the field to be added. */
  indexMappings: ESIndexMapping[];

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
  path,
  defaultColumns,
  apiClient
}: GenerateColumnDefinitionProps<TData>): Promise<
  TableColumn<TData> | undefined
> {
  // Link the path to a index mapping.
  const indexMapping = indexMappings.find((mapping) => mapping.value);

  // Check if it's a dynamic field if it could not be found directly in the index mapping.
  if (!indexMapping) {
    return await getDynamicFieldColumn(path, apiClient);
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
  apiClient: Kitsu
): Promise<TableColumn<TData> | undefined> {
  // if (columnMapping.type === "fieldExtension") {
  //   // return await getExtensionValuesColumn(columnMapping, apiClient);
  // } else if (columnMapping.type === "managedAttribute") {
  //   return await getManagedAttributesColumn(columnMapping, apiClient);
  // } else {
  //   throw Error("Uncaught queryOption type.");
  // }
  throw Error("Uncaught queryOption type.");
}

async function getManagedAttributesColumn<TData extends KitsuResource>(
  columnMapping: ESIndexMapping,
  apiClient: Kitsu
): Promise<TableColumn<TData> | undefined> {
  const params = {
    filter: {
      managedAttributeComponent: columnMapping.dynamicField?.component ?? ""
    },
    page: { limit: 1000 }
  };
  try {
    const managedAttributes = await fetchDynamicField(
      apiClient,
      columnMapping.dynamicField?.apiEndpoint,
      params
    );
    if (columnMapping.parentType) {
      // Handle included managed attribute
      return getIncludedManagedAttributeColumn<TData>(
        managedAttributes,
        columnMapping
      );
    } else {
      return getAttributesManagedAttributeColumn<TData>(
        managedAttributes,
        columnMapping
      );
    }
  } catch (error) {
    // Handle the error here, e.g., log it or display an error message.
    throw error;
  }
}

export function getIncludedManagedAttributeColumn<TData extends KitsuResource>(
  managedAttribute: any,
  columnMapping: ESIndexMapping
): TableColumn<TData> {
  const managedAttributeKey = managedAttribute.key;
  const accessorKey = `${columnMapping.path}.${managedAttributeKey}`;

  const managedAttributesColumn = {
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
    header: () => <FieldHeader name={managedAttribute.name} />,
    accessorKey,
    id: `${columnMapping.parentName}.${columnMapping.label}.${managedAttributeKey}`,
    isKeyword: managedAttribute.vocabularyElementType === "STRING",
    isColumnVisible: true,
    relationshipType: columnMapping.parentType,
    managedAttribute,
    columnMapping
  };

  return managedAttributesColumn;
}

export function getAttributesManagedAttributeColumn<
  TData extends KitsuResource
>(managedAttribute: any, columnMapping: ESIndexMapping): TableColumn<TData> {
  const managedAttributeKey = managedAttribute.key;
  const accessorKey = `${columnMapping.path}.${managedAttributeKey}`;
  const managedAttributesColumn = {
    header: () => <FieldHeader name={managedAttribute.name} />,
    accessorKey,
    id: `${columnMapping.label}.${managedAttributeKey}`,
    isKeyword: managedAttribute.vocabularyElementType === "STRING",
    isColumnVisible: true,
    columnMapping,
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
