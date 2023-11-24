import { query } from "kitsu-core";
import { FieldHeader, dateCell } from "..";
import { TableColumn } from "../list-page/types";
import { KitsuResource } from "kitsu";

export function getQueryBuilderColumns<TData extends KitsuResource>(
  parameters: any[],
  formatMessage
): TableColumn<TData>[] {
  const queryBuilderColumns: TableColumn<TData>[] = [];
  parameters.forEach((queryParameter) => {
    const flattenedParameter = flattenObject(queryParameter);
    Object.entries<string>(flattenedParameter).forEach(
      ([paramKey, paramValue]) => {
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
        } else if (paramKey.includes("included.attributes")) {
          const includedAttributesIndex = paramKey.indexOf(
            "included.attributes"
          );
          let includedType: string = "";
          for (const [key, value] of Object.entries<string>(
            flattenedParameter
          )) {
            if (key.includes("included.type")) {
              includedType = value;
            }
          }
          const queryKey = paramKey.slice(includedAttributesIndex);
          const includedAttributesField = paramKey.includes(
            "included.attributes"
          )
            ? paramKey
            : paramValue;
        }
      }
    );
  });

  return queryBuilderColumns;
}

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
  const columnName = queryKey.includes("keyword")
    ? queryKey.split(".").slice(3, 5).join(".")
    : queryKey.slice(queryKey.lastIndexOf(".") + 1);
  const column = {
    id: columnName,
    header: () => <FieldHeader name={columnName} />,
    accessorKey: queryKey.replace(".keyword", ""),
    isKeyword: !!queryKey.includes("keyword")
  };
  return column;
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
    })
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
