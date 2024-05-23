import { FieldHeader, dateCell } from "..";
import { DynamicField, ESIndexMapping, TableColumn } from "../list-page/types";
import Kitsu, { GetParams, KitsuResource } from "kitsu";
import lodash, { get, startCase } from "lodash";
import { useMemo } from "react";
import { useIntl } from "react-intl";

export interface ColumnSelectorIndexMapColumns<TData extends KitsuResource> {
  indexMapping?: ESIndexMapping[];
  setColumnOptions?: React.Dispatch<React.SetStateAction<TableColumn<TData>[]>>;
  apiClient: Kitsu;
}

// Hook to get all of index map columns to be added to column selector
export async function getColumnSelectorIndexMapColumns<
  TData extends KitsuResource
>({
  indexMapping,
  setColumnOptions,
  apiClient
}: ColumnSelectorIndexMapColumns<TData>) {
  const columnOptions: TableColumn<TData>[] = [];

  if (indexMapping) {
    for (const indexColumn of indexMapping) {
      // Check if it's a dynamic field that needs to be loaded in using the API client.
      if (indexColumn.dynamicField) {
        await getDynamicFieldColumns(indexColumn, apiClient, columnOptions);
      } else {
        if (indexColumn.parentType) {
          const accessorKey = `${indexColumn.parentPath}.${indexColumn.path}.${indexColumn.label}`;

          if (indexColumn.type === "date") {
            columnOptions.push(
              dateCell(
                indexColumn.value,
                accessorKey,
                indexColumn.parentType,
                false,
                indexColumn
              )
            );
          } else {
            columnOptions.push({
              id: indexColumn.value,
              header: () => <FieldHeader name={indexColumn.value} />,
              accessorKey,
              isKeyword: indexColumn.keywordMultiFieldSupport,
              isColumnVisible: false,
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
        } else {
          if (indexColumn.type === "date") {
            columnOptions.push(
              dateCell(
                indexColumn?.label,
                indexColumn?.value,
                undefined,
                false,
                indexColumn
              )
            );
          } else {
            columnOptions.push({
              id: indexColumn?.label,
              header: () => <FieldHeader name={indexColumn?.label} />,
              accessorKey: indexColumn?.value,
              isKeyword: indexColumn?.keywordMultiFieldSupport
            });
          }
        }
      }

      setColumnOptions?.(columnOptions);
    }
  }
}

export function addColumnToStateVariable<TData extends KitsuResource>(
  column,
  columnOptions: TableColumn<TData>[],
  columnSelectorDefaultColumns?: any[]
) {
  if (
    !columnOptions.find(
      (currentColumn) => currentColumn.id === (column as any).id
    ) &&
    !columnSelectorDefaultColumns?.find(
      (defaultColumn) =>
        defaultColumn.accessorKey === column.accessorKey &&
        defaultColumn.relationshipType === column.relationshipType
    )
  ) {
    columnOptions.push(column);
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
      getIncludedManagedAttributeColumn<TData>(
        managedAttribute,
        columnMapping,
        columnOptions
      )
  );

  columnOptions.push(includedManagedAttributeColumns);
}

export function getIncludedManagedAttributeColumn<TData extends KitsuResource>(
  managedAttribute: any,
  columnMapping: ESIndexMapping,
  columnOptions?: TableColumn<TData>[],
  columnSelectorDefaultColumns?: any[]
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
    id: `${columnMapping.label}.${managedAttributeKey}`,
    isKeyword: managedAttribute.vocabularyElementType === "STRING",
    isColumnVisible: false,
    relationshipType: columnMapping.parentType,
    managedAttribute,
    columnMapping
  };

  if (columnOptions) {
    addColumnToStateVariable(
      managedAttributesColumn,
      columnOptions,
      columnSelectorDefaultColumns
    );
  }

  return managedAttributesColumn;
}

function getAttributesManagedAttributeColumns<TData extends KitsuResource>(
  managedAttributes,
  columnMapping: ESIndexMapping,
  columnOptions: TableColumn<TData>[]
) {
  const attributesManagedAttributeColumns = managedAttributes?.map(
    (managedAttribute) =>
      getAttributesManagedAttributeColumn<TData>(
        managedAttribute,
        columnMapping,
        columnOptions
      )
  );

  columnOptions.push(attributesManagedAttributeColumns);
}

export function getAttributesManagedAttributeColumn<
  TData extends KitsuResource
>(
  managedAttribute: any,
  columnMapping: ESIndexMapping,
  columnOptions?: TableColumn<TData>[],
  columnSelectorDefaultColumns?: any[]
) {
  const managedAttributeKey = managedAttribute.key;
  const accessorKey = `${columnMapping.path}.${managedAttributeKey}`;
  const managedAttributesColumn = {
    header: () => <FieldHeader name={managedAttribute.name} />,
    accessorKey,
    id: `${columnMapping.label}.${managedAttributeKey}`,
    isKeyword: managedAttribute.vocabularyElementType === "STRING",
    isColumnVisible: false,
    columnMapping,
    managedAttribute,
    sortDescFirst: true
  };
  if (columnOptions) {
    addColumnToStateVariable<TData>(
      managedAttributesColumn,
      columnOptions,
      columnSelectorDefaultColumns
    );
  }
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

export function getAttributeExtensionFieldColumn<TData extends KitsuResource>(
  columnMapping: ESIndexMapping,
  extensionValue: any,
  extensionField: any,
  columnOptions?: TableColumn<TData>[],
  columnSelectorDefaultColumns?: any[]
) {
  const fieldExtensionResourceType = columnMapping.path.split(".").at(-1);
  const extensionValuesColumn = {
    accessorKey: `${columnMapping.path}.${extensionValue.id}.${extensionField.key}`,
    id: `${fieldExtensionResourceType}.${extensionValue.id}.${extensionField.key}`,
    header: () => (
      <FieldHeader name={`${extensionValue.id}.${extensionField.key}`} />
    ),
    isKeyword: columnMapping.keywordMultiFieldSupport,
    isColumnVisible: false,
    columnMapping,
    extensionValue,
    extensionField
  };
  if (columnOptions) {
    addColumnToStateVariable<TData>(
      extensionValuesColumn,
      columnOptions,
      columnSelectorDefaultColumns
    );
  }
  return extensionValuesColumn;
}

// Fetch filtered dynamic field from back end
async function fetchDynamicField(apiClient: Kitsu, path, params?: GetParams) {
  const { data } = await apiClient.get(path, params ?? {});

  return data;
}

interface QueryOption {
  parentName: any;
  value: string;
  label: string;
  type: string;
  subType?: string | undefined;
  distinctTerm: boolean;
  optimizedPrefix: boolean;
  containsSupport: boolean;
  endsWithSupport: boolean;
  keywordMultiFieldSupport: boolean;
  path: string;
  parentPath?: string | undefined;
  parentType?: string | undefined;
  dynamicField?: DynamicField | undefined;
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

export function getIncludedExtensionFieldColumn<TData extends KitsuResource>(
  columnMapping: ESIndexMapping,
  extensionValue: any,
  extensionField: any,
  columnOptions?: TableColumn<TData>[],
  columnSelectorDefaultColumns?: any[]
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
    id: `${fieldExtensionResourceType}.${extensionValue.id}.${extensionField.key}`,
    header: () => (
      <FieldHeader name={`${extensionValue.id}.${extensionField.key}`} />
    ),
    isKeyword: columnMapping.keywordMultiFieldSupport,
    isColumnVisible: false,
    relationshipType: columnMapping.parentType,
    columnMapping,
    extensionValue,
    extensionField
  };
  if (columnOptions) {
    addColumnToStateVariable<TData>(
      extensionValuesColumn,
      columnOptions,
      columnSelectorDefaultColumns
    );
  }
  return extensionValuesColumn;
}

export function getGroupedIndexMappings(
  indexName: string,
  indexMap: ESIndexMapping[] | undefined
) {
  const { formatMessage, locale, messages } = useIntl();
  return useMemo(() => {
    // Get all of the attributes from the index for the filter dropdown.
    const columnSelectorParentNameMap = {
      dina_material_sample_index: "Material Sample",
      dina_loan_transaction_index: "Loan Transaction",
      dina_object_store_index: "Object Store"
    };
    const attributeMappings = indexMap
      ?.filter((indexMapping) => !indexMapping.parentPath)
      ?.map((indexMapping) => ({
        ...indexMapping,
        parentName: columnSelectorParentNameMap[indexName]
      }))
      ?.sort((aProp, bProp) => aProp.label.localeCompare(bProp.label));

    // Get all the relationships for the search dropdown.
    const relationshipMappings = indexMap
      ?.filter((indexMapping) => !!indexMapping.parentPath)
      ?.map((indexMapping) => {
        return {
          parentName: indexMapping.parentName,
          ...indexMapping
        };
      })
      ?.sort((aProp, bProp) => aProp.label.localeCompare(bProp.label));

    // Using the parent name, group the attributes into section
    const groupedAttributeMappings = lodash
      .chain(attributeMappings)
      .groupBy((prop) => prop.parentName)
      .map((group, key) => {
        return {
          label: messages["title_" + key]
            ? formatMessage({ id: "title_" + key })
            : startCase(key),
          options: group
        };
      })
      .sort((aProp, bProp) => aProp.label.localeCompare(bProp.label))
      .value();

    // Using the parent name, group the relationships into sections.
    const groupedRelationshipMappings = lodash
      .chain(relationshipMappings)
      .groupBy((prop) => prop.parentName)
      .map((group, key) => {
        return {
          label: messages["title_" + key]
            ? formatMessage({ id: "title_" + key })
            : startCase(key),
          options: group
        };
      })
      .sort((aProp, bProp) => aProp.label.localeCompare(bProp.label))
      .value();
    const groupedMappings = [
      ...groupedAttributeMappings,
      ...groupedRelationshipMappings
    ];

    return groupedAttributeMappings ? groupedMappings : [];
  }, [indexMap, locale]);
}
