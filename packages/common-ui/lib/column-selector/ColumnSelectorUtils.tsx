import { FieldHeader, dateCell, useApiClient } from "..";
import { DynamicFieldsMappingConfig, TableColumn } from "../list-page/types";
import { KitsuResource } from "kitsu";
import { get } from "lodash";
import { useIndexMapping } from "../list-page/useIndexMapping";
import { useEffect } from "react";

export interface ColumnSelectorIndexMapColumns {
  indexName: string;

  /**
   * This is used to indicate to the QueryBuilder all the possible places for dynamic fields to
   * be searched against. It will also define the path and data component if required.
   *
   * Dynamic fields are like Managed Attributes or Field Extensions where they are provided by users
   * or grouped terms.
   */
  dynamicFieldMapping?: DynamicFieldsMappingConfig;
}

export function useColumnSelectorIndexMapColumns({
  indexName,
  dynamicFieldMapping
}: ColumnSelectorIndexMapColumns) {
  const { indexMap } = useIndexMapping({
    indexName,
    dynamicFieldMapping
  });
  const { apiClient } = useApiClient();
  const columnSelectorIndexMapColumns = [];

  async function fetchExtensionValues(path, filter) {
    const resp = await apiClient.get(path, {
      filter
    });
  }

  async function fetchDynamicField(path) {
    const resp = await apiClient.get(path, {});
  }

  useEffect(() => {
    if (indexMap) {
      for (const columnMapping of indexMap) {
        if (columnMapping.dynamicField) {
          if (columnMapping.path.includes("extensionValues")) {
            const filter = {
              "extension.fields.dinaComponent":
                columnMapping.dynamicField.component
            };
            fetchExtensionValues(
              columnMapping.dynamicField.apiEndpoint,
              filter
            );
          } else {
            fetchDynamicField(columnMapping.dynamicField.apiEndpoint);
          }
        } else {
          // TODO: implement parsing
          continue;
        }
      }
    }
  }, []);

  return [];
}

export function getQueryBuilderColumns<TData extends KitsuResource>(
  parameters: any[],
  formatMessage
): TableColumn<TData>[] {
  const queryBuilderColumns: TableColumn<TData>[] = [];
  parameters.forEach((queryParameter) => {
    const flattenedParameter = flattenObject(queryParameter);
    Object.entries<string>(flattenedParameter).forEach(
      ([paramKey, paramValue]) => {
        // Handle getting data attributes columns
        if (
          paramKey.includes("data.attributes") ||
          paramValue.includes("data.attributes")
        ) {
          const dataAttributesField = paramKey.includes("data.attributes")
            ? paramKey
            : paramValue;
          getDataAttributesColumn<TData>(
            dataAttributesField,
            formatMessage,
            queryBuilderColumns
          );
        } else if (
          paramKey.includes("included.attributes") ||
          paramValue.includes("included.attributes")
        ) {
          // Handle getting included attribibutes columns
          const includedAttributesField = paramKey.includes(
            "included.attributes"
          )
            ? paramKey
            : paramValue;

          let includedType: string = "";
          for (const [key, value] of Object.entries<string>(
            flattenedParameter
          )) {
            if (key.includes("included.type")) {
              includedType = value;
            }
          }
          getIncludedAttributeColumn<TData>(
            includedAttributesField,
            includedType,
            formatMessage,
            queryBuilderColumns
          );
        }
      }
    );
  });

  return queryBuilderColumns;
}

function getIncludedAttributeColumn<TData extends KitsuResource>(
  includedAttributesField: string,
  includedType: string,
  formatMessage: any,
  queryBuilderColumns: TableColumn<TData>[]
) {
  const includedAttributesIndex = includedAttributesField.indexOf(
    "included.attributes"
  );

  const queryKey = includedAttributesField.slice(includedAttributesIndex);
  let column;
  if (queryKey.includes("managedAttributes")) {
    // Handle getting managed attributes column case
    column = getIncludedManagedAttributesColumn(
      queryKey,
      formatMessage,
      includedType
    );
  } else if (
    queryKey.toLowerCase().includes("date") ||
    queryKey.toLowerCase().includes("createdon")
  ) {
    // Handle getting date column
    const dateColumName = queryKey.split(".")[2];
    const accessorKey = queryKey.split(".").slice(0, 3).join(".");
    column = dateCell(dateColumName, accessorKey, includedType);
  } else if (queryKey.includes("extensionValues")) {
    // Handle getting extension values column
    column = getIncludedExtensionValuesColumn(queryKey, includedType);
  } else {
    // Handle all standard columns
    column = getIncludedStandardColumn(queryKey, includedType);
  }

  // Handle edge case where the flattened parameter has multiple "included.attributes" that results in duplicate columns
  const duplicateIndex = queryBuilderColumns.findIndex((value) => {
    const valueAccessorKey: string = (value as any).accessorKey;
    const columnAccessorKey: string = column.accessorKey;
    if (
      valueAccessorKey.includes(columnAccessorKey) ||
      columnAccessorKey.includes(valueAccessorKey)
    ) {
      return true;
    } else {
      return false;
    }
  });
  if (duplicateIndex !== -1 && !column.isKeyword) {
    // Prioritize keeping the columns that dont have "keyword"
    queryBuilderColumns[duplicateIndex] = column;
  } else {
    queryBuilderColumns.push(column);
  }
}

// Get data attributes column
function getDataAttributesColumn<TData extends KitsuResource>(
  dataAttributesField: string,
  formatMessage: any,
  queryBuilderColumns: TableColumn<TData>[]
) {
  const dataAttributesIndex = dataAttributesField.indexOf("data.attributes");
  const queryKey = dataAttributesField.slice(dataAttributesIndex);
  if (queryKey.includes("managedAttributes")) {
    // Handle getting managed attributes column case
    const managedAttributesColumn = getManagedAttributesColumn(
      queryKey,
      formatMessage
    );
    queryBuilderColumns.push(managedAttributesColumn);
  } else if (
    queryKey.toLowerCase().includes("date") ||
    queryKey.toLowerCase().includes("createdon")
  ) {
    // Handle getting date column
    const dateColumName = queryKey.split(".")[2];
    const accessorKey = queryKey.split(".").slice(0, 3).join(".");
    queryBuilderColumns.push(dateCell(dateColumName, accessorKey));
  } else if (queryKey.includes("extensionValues")) {
    // Handle getting extension values column
    const extensionValuesColumn = getExtensionValuesColumn(queryKey);
    queryBuilderColumns.push(extensionValuesColumn);
  } else {
    // Handle all standard columns
    const column = getStandardColumn(queryKey);
    queryBuilderColumns.push(column);
  }
}

// Get standard data attributes column from Elastic Search field
function getStandardColumn(queryKey: string) {
  const columnName = queryKey.split(".")[2];
  const column = {
    id: columnName,
    header: () => <FieldHeader name={columnName} />,
    accessorKey: queryKey.replace(".keyword", ""),
    isKeyword: !!queryKey.includes("keyword")
  };
  return column;
}

function getIncludedStandardColumn(queryKey: string, includedType: string) {
  const columnName = queryKey.split(".")[2];

  const standardColumn = {
    id: columnName,
    cell: ({ row: { original } }) => {
      const relationshipAccessor = queryKey?.split(".");
      relationshipAccessor?.splice(1, 0, includedType);
      const relationshipAccessorKey = relationshipAccessor?.join(".");
      const value = get(original, relationshipAccessorKey);
      return <>{value}</>;
    },
    header: () => <FieldHeader name={columnName} />,
    accessorKey: queryKey,
    relationshipType: includedType,
    isKeyword: !!queryKey.includes("keyword")
  };
  return standardColumn;
}

// Get Extension Values column from Elastic Search field
function getExtensionValuesColumn(queryKey: string) {
  const extensionValueName = queryKey.split(".").slice(3, 5).join(".");
  const extensionValuesColumn = {
    header: () => <FieldHeader name={extensionValueName} />,
    accessorKey: queryKey.replace(".keyword", ""),
    id: extensionValueName,
    isKeyword: true
  };
  return extensionValuesColumn;
}

// Get included Extension Values column from ES field
function getIncludedExtensionValuesColumn(
  queryKey: string,
  includedType: string
) {
  const extensionValueName = queryKey.split(".").slice(3, 5).join(".");
  const extensionValuesColumn = {
    cell: ({ row: { original } }) => {
      const relationshipAccessor = queryKey?.split(".");
      relationshipAccessor?.splice(1, 0, includedType);
      const relationshipAccessorKey = relationshipAccessor
        ?.join(".")
        .replace(".keyword", "");
      const value = get(original, relationshipAccessorKey);
      return <>{value}</>;
    },
    header: () => <FieldHeader name={extensionValueName} />,
    accessorKey: queryKey.replace(".keyword", ""),
    id: extensionValueName,
    isKeyword: true,
    relationshipType: includedType
  };
  return extensionValuesColumn;
}

// Get Managed Attributes column from Elastic Search field
function getManagedAttributesColumn(queryKey: string, formatMessage: any) {
  const managedAttributesKey = queryKey.slice(queryKey.lastIndexOf(".") + 1);
  const managedAttributesColumn = {
    header: () => (
      <FieldHeader
        name={formatMessage("managedAttribute", {
          name: managedAttributesKey
        })}
      />
    ),
    accessorKey: queryKey,
    id: formatMessage("managedAttribute", {
      name: managedAttributesKey
    }),
    isKeyword: !!queryKey.includes("keyword")
  };
  return managedAttributesColumn;
}

// Get relationship Managed Attributes column from Elastic Search field
function getIncludedManagedAttributesColumn(
  queryKey: string,
  formatMessage: any,
  includedType: string
) {
  const managedAttributesKey = queryKey.slice(queryKey.lastIndexOf(".") + 1);
  const managedAttributesColumn = {
    cell: ({ row: { original } }) => {
      const relationshipAccessor = queryKey?.split(".");
      relationshipAccessor?.splice(1, 0, includedType);
      const relationshipAccessorKey = relationshipAccessor?.join(".");
      const value = get(original, relationshipAccessorKey);
      return <>{value}</>;
    },
    header: () => (
      <FieldHeader
        name={formatMessage("managedAttribute", {
          name: managedAttributesKey
        })}
      />
    ),
    accessorKey: queryKey,
    id: formatMessage("managedAttribute", {
      name: managedAttributesKey
    }),
    relationshipType: includedType
  };
  return managedAttributesColumn;
}

/**
 * Return a flattened object with nested keys concatenated with "."
 * @param ob
 * @returns Flattened object
 */
function flattenObject(ob) {
  const toReturn = {};

  for (const i in ob) {
    if (!ob.hasOwnProperty(i)) continue;

    if (typeof ob[i] === "object" && ob[i] !== null) {
      const flatObject = flattenObject(ob[i]);
      for (const x in flatObject) {
        if (!flatObject.hasOwnProperty(x)) continue;

        toReturn[i + "." + x] = flatObject[x];
      }
    } else {
      toReturn[i] = ob[i];
    }
  }
  return toReturn;
}
