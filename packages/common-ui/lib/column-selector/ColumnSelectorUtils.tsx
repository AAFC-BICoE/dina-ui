import { query } from "kitsu-core";
import { FieldHeader } from "..";
import { TableColumn } from "../list-page/types";
import { KitsuResource } from "kitsu";

export function getQueryBuilderColumns<TData extends KitsuResource>(
  parameters: any[],
  formatMessage
): TableColumn<TData>[] {
  const queryBuilderColumns: TableColumn<TData>[] = [];
  parameters.forEach((queryParameter) => {
    const flattenedParameter = flattenObject(queryParameter);
    Object.keys(flattenedParameter).forEach((paramKey) => {
      if (paramKey.includes("data.attributes")) {
        const dataAttributesIndex = paramKey.indexOf("data.attributes");
        const queryKey = paramKey.slice(dataAttributesIndex);
        if (queryKey.includes("managedAttributes")) {
          const managedAttributesColumn = getManagedAttributesColumn(
            queryKey,
            formatMessage
          );
          queryBuilderColumns.push(managedAttributesColumn);
        }
      } else if (paramKey.includes("included.attributes")) {
        const includedAttributesIndex = paramKey.indexOf("included.attributes");
        let includedType: string = "";
        for (const [key, value] of Object.entries<string>(flattenedParameter)) {
          if (key.includes("included.type")) {
            includedType = value;
          }
        }
        const queryKey = paramKey.slice(includedAttributesIndex);
      }
    });
  });

  return queryBuilderColumns;
}

function getManagedAttributesColumn(queryKey: string, formatMessage: any) {
  const managedAttributesKey = queryKey.slice(queryKey.lastIndexOf(".") + 1);
  const managedAttributesName = managedAttributesKey.replaceAll("_", " ");
  const managedAttributesColumn = {
    header: () => (
      <FieldHeader
        name={formatMessage("managedAttribute", {
          name: managedAttributesName
        })}
      />
    ),
    accessorKey: queryKey,
    id: formatMessage("managedAttribute", {
      name: managedAttributesName
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
