import {
  GroupProperties,
  ImmutableTree,
  JsonTree,
  Utils
} from "react-awesome-query-builder";
import { SimpleQueryGroup, SimpleQueryRow } from "./types";

/**
 * Function to serialize query tree into a URL-safe string.
 *
 * Sub-groups are currently not supported.
 *
 * @param queryTree Tree to be serialized.
 * @returns JSON string or null if cannot be serialized.
 */
export function serializeQueryTreeToURL(
  queryTree: ImmutableTree
): string | null {
  const jsonTree = Utils.getTree(queryTree);
  const props: (SimpleQueryRow | null)[] = (jsonTree.children1 as any[])?.map(
    (child) => {
      if (!child.properties.field) {
        return null;
      }

      return {
        field: child.properties.field,
        operator: child.properties.operator,
        value: child.properties.value[0] ?? "",
        type: child.properties.valueType[0] ?? "text"
      };
    }
  );

  // Filter out null values
  const filteredProps: SimpleQueryRow[] = props.filter(
    (item): item is SimpleQueryRow => item !== null
  );

  // If any null values were found, return null
  if (filteredProps.length !== props.length) {
    return null;
  }

  const simpleQueryGroup: SimpleQueryGroup = {
    conj: (jsonTree.properties as GroupProperties)?.conjunction,
    props: filteredProps
  };
  return JSON.stringify(simpleQueryGroup);
}

// Function to parse query tree from URL
export function parseQueryTreeFromURL(
  queryParam: string | undefined
): ImmutableTree | null {
  if (!queryParam) return null;

  try {
    const parsedSimpleQueryGroup: SimpleQueryGroup = JSON.parse(queryParam);
    const parsedJsonTree: JsonTree = generateJsonTreeFromSimpleQueryGroup(
      parsedSimpleQueryGroup
    );
    const parsedImmutableTree = Utils.loadTree(parsedJsonTree);
    return parsedImmutableTree;
  } catch (error) {
    console.error("Error parsing query tree:", error);
    return null;
  }
}

export function generateJsonTreeFromSimpleQueryGroup(
  simpleQueryGroup: SimpleQueryGroup
): JsonTree {
  const children: any = simpleQueryGroup.props.map(
    (simpleQueryRow: SimpleQueryRow) => {
      return {
        id: Utils.uuid(),
        type: "rule",
        properties: {
          field: simpleQueryRow.field,
          operator: simpleQueryRow.operator,
          value: [simpleQueryRow.value],
          valueSrc: ["value"],
          valueType: [simpleQueryRow.type]
        }
      };
    }
  );
  return {
    id: Utils.uuid(),
    type: "group",
    properties: {
      conjunction: simpleQueryGroup.conj
    },
    children1: children
  };
}
