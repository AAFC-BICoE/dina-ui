import { FieldHeader, dateCell } from "..";
import { ESIndexMapping, TableColumn } from "../list-page/types";
import Kitsu, { GetParams, KitsuResource } from "kitsu";
import { get } from "lodash";
import React from "react";

export interface ColumnSelectorIndexMapColumns<TData extends KitsuResource> {
  /**
   * Index mapping used to determine all the supported fields that can be displayed.
   */
  indexMapping?: ESIndexMapping[];

  /**
   * Any missing items or preferred table mappings
   */
  defaultColumns?: TableColumn<TData>[];

  /**
   * State to be set which will hold all the options.
   */
  setColumnOptions?: React.Dispatch<React.SetStateAction<TableColumn<TData>[]>>;

  /**
   * Once the list has been loaded, the loading can be set as completed.
   */
  setLoading?: React.Dispatch<React.SetStateAction<boolean>>;

  /**
   * API client to be used for the dynamic fields.
   */
  apiClient: Kitsu;

  /**
   * Array of relationshipType columns to be excluded from the dropdown menu
   */
  excludedRelationshipTypes?: string[];
}

// Hook to get all of index map columns to be added to column selector
export async function getColumnSelectorIndexMapColumns<
  TData extends KitsuResource
>({
  indexMapping,
  defaultColumns,
  setColumnOptions,
  setLoading,
  apiClient,
  excludedRelationshipTypes
}: ColumnSelectorIndexMapColumns<TData>) {
  let columnOptions: TableColumn<TData>[] = [];
  let defaultColumnsCopy = defaultColumns;

  if (indexMapping) {
    for (const indexColumn of indexMapping) {
      // Check if it's a dynamic field that needs to be loaded in using the API client.
      if (indexColumn.dynamicField) {
        await getDynamicFieldColumns(indexColumn, apiClient, columnOptions);
      } else if (indexColumn.hideField) {
        // Skip this field, it shouldn't be displayed.
        continue;
      } else {
        if (indexColumn.parentType) {
          // Check if it's mapped in the default columns, and just use that definition.
          const defaultColumnFound = defaultColumnsCopy?.find(
            (item) => item.id === indexColumn.value
          );
          if (defaultColumnFound) {
            columnOptions.push(defaultColumnFound);
            defaultColumnsCopy = defaultColumnsCopy?.filter(
              (item) => item.id !== indexColumn.value
            );
            continue;
          }

          getNestedColumns(indexColumn, columnOptions);
        } else {
          // Check if it's mapped in the default columns, and just use that definition.
          const defaultColumnFound = defaultColumnsCopy?.find(
            (item) => item.id === indexColumn.label
          );
          if (defaultColumnFound) {
            columnOptions.push(defaultColumnFound);
            defaultColumnsCopy = defaultColumnsCopy?.filter(
              (item) => item.id !== indexColumn.label
            );
            continue;
          }

          getEntityColumns(indexColumn, columnOptions);
        }
      }
    }

    // Add the rest of the default options not added yet.
    if (defaultColumnsCopy) {
      columnOptions.push(...defaultColumnsCopy);
    }
    if (excludedRelationshipTypes) {
      const excludedColumnOptions = columnOptions.filter((columnOption) =>
        columnOption.relationshipType
          ? !excludedRelationshipTypes.includes(columnOption.relationshipType)
          : true
      );
      columnOptions = excludedColumnOptions;
    }

    setColumnOptions?.(columnOptions);
    setLoading?.(false);
  }
}

function getEntityColumns<TData extends KitsuResource>(
  indexColumn: ESIndexMapping,
  columnOptions: TableColumn<TData>[]
) {
  if (indexColumn.type === "date") {
    columnOptions.push(
      dateCell(
        indexColumn?.label,
        indexColumn?.value,
        undefined,
        true,
        indexColumn
      )
    );
  } else {
    columnOptions.push({
      id: indexColumn.label,
      header: () => <FieldHeader name={indexColumn?.label} />,
      accessorKey: indexColumn?.value,
      isKeyword: indexColumn?.keywordMultiFieldSupport
    });
  }
}

function getNestedColumns<TData extends KitsuResource>(
  indexColumn: ESIndexMapping,
  columnOptions: TableColumn<TData>[]
) {
  const accessorKey = `${indexColumn.parentPath}.${
    indexColumn.path.split(".")[0]
  }.${indexColumn.label}`;

  if (indexColumn.type === "date") {
    columnOptions.push(
      dateCell(
        indexColumn.value,
        accessorKey,
        indexColumn.parentType,
        true,
        indexColumn
      )
    );
  } else {
    columnOptions.push({
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
    });
  }
}

// Handle getting columns from query options that contain dynamicField
async function getDynamicFieldColumns<TData extends KitsuResource>(
  columnMapping: ESIndexMapping,
  apiClient: Kitsu,
  columnOptions: TableColumn<TData>[]
) {
  if (columnMapping.type === "fieldExtension") {
    await getExtensionValuesColumns(columnMapping, apiClient, columnOptions);
  } else if (columnMapping.type === "managedAttribute") {
    await getManagedAttributesColumns(columnMapping, apiClient, columnOptions);
  } else {
    throw Error("Uncaught queryOption type.");
  }
}

async function getManagedAttributesColumns<TData extends KitsuResource>(
  columnMapping: ESIndexMapping,
  apiClient: Kitsu,
  columnOptions: TableColumn<TData>[]
) {
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
      getIncludedManagedAttributeColumns<TData>(
        managedAttributes,
        columnMapping,
        columnOptions
      );
    } else {
      getAttributesManagedAttributeColumns<TData>(
        managedAttributes,
        columnMapping,
        columnOptions
      );
    }
  } catch (error) {
    // Handle the error here, e.g., log it or display an error message.
    throw error;
  }
}

function getIncludedManagedAttributeColumns<TData extends KitsuResource>(
  managedAttributes,
  columnMapping: ESIndexMapping,
  columnOptions: TableColumn<TData>[]
) {
  const includedManagedAttributeColumns = managedAttributes?.map(
    (managedAttribute) =>
      getIncludedManagedAttributeColumn(managedAttribute, columnMapping)
  );

  columnOptions.push(...includedManagedAttributeColumns);
}

export function getIncludedManagedAttributeColumn(
  managedAttribute: any,
  columnMapping: ESIndexMapping
) {
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

function getAttributesManagedAttributeColumns<TData extends KitsuResource>(
  managedAttributes,
  columnMapping: ESIndexMapping,
  columnOptions: TableColumn<TData>[]
) {
  const attributesManagedAttributeColumns = managedAttributes?.map(
    (managedAttribute) =>
      getAttributesManagedAttributeColumn(managedAttribute, columnMapping)
  );

  columnOptions.push(...attributesManagedAttributeColumns);
}

export function getAttributesManagedAttributeColumn(
  managedAttribute: any,
  columnMapping: ESIndexMapping
) {
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

function getAttributesExtensionValuesColumns<TData extends KitsuResource>(
  extensionValues,
  columnMapping: ESIndexMapping,
  columnOptions: TableColumn<TData>[]
) {
  const totalAttributesExtensionValuesCols: TableColumn<TData>[] = [].concat(
    ...extensionValues?.map((extensionValue) =>
      getAttributeExtensionValuesColumn(extensionValue, columnMapping)
    )
  );

  columnOptions.push(...totalAttributesExtensionValuesCols);
}

function getAttributeExtensionValuesColumn(
  extensionValue: any,
  columnMapping: ESIndexMapping
) {
  const extensionFields = extensionValue.extension.fields;
  const attributeExtensionValuesColumns = extensionFields?.map(
    (extensionField) =>
      getAttributeExtensionFieldColumn(
        columnMapping,
        extensionValue,
        extensionField
      )
  );
  return attributeExtensionValuesColumns;
}

export function getAttributeExtensionFieldColumn(
  columnMapping: ESIndexMapping,
  extensionValue: any,
  extensionField: any
) {
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
async function getExtensionValuesColumns<TData extends KitsuResource>(
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
      getAttributesExtensionValuesColumns(
        extensionValues,
        columnMapping,
        columnOptions
      );
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
