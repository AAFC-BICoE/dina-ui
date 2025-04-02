import {
  GroupProperties,
  ImmutableTree,
  JsonTree,
  Utils
} from "react-awesome-query-builder";
import { SimpleQueryGroup, SimpleQueryRow } from "./types";
import { isDynamicFieldType } from "../types";
import { ManagedAttributeSearchStates } from "../query-builder/query-builder-value-types/QueryBuilderManagedAttributeSearch";

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
      const field = child.properties.field;
      if (!field) {
        return null;
      }

      const operator = child.properties.operator;
      const value = child.properties.value[0] ?? "";
      const type = child.properties.valueType[0] ?? "text";

      if (isDynamicFieldType(type)) {
        return serializeDynamicFields(field, operator, value, type);
      } else {
        return {
          f: field,
          o: operator,
          v: value,
          t: type
        };
      }
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
    c: serializeConjunction(
      (jsonTree.properties as GroupProperties)?.conjunction
    ),
    p: filteredProps
  };
  return JSON.stringify(simpleQueryGroup);
}

/**
 * Shortens the conjunction to a single character to save space on the URL.
 *
 * @param conjunction "AND" / "OR"
 * @returns "a" / "o"
 */
function serializeConjunction(conjunction: string): string {
  return conjunction === "OR" ? "o" : "a";
}

/**
 * Parses the shortened conjunction back to full form.
 *
 * @param shortConj "a" / "o"
 * @returns "AND" / "OR"
 */
function parseConjunction(shortConj: string): string {
  return shortConj === "o" ? "OR" : "AND";
}

/**
 * Handle special dynamic field edge values. If no special case defined here, then just treat it
 * as a normal field.
 *
 * @param field query builder field
 * @param operator query builder operator (probably noOperator for most)
 * @param value query builder value (usually a JSON state.)
 * @param type query builder type
 * @returns SimpleQueryRow structure.
 */
function serializeDynamicFields(
  field: string,
  operator: string,
  value: string,
  type: string
): SimpleQueryRow {
  switch (type) {
    // Instead of displaying noOperator, take it from the state itself.
    case "managedAttribute":
      const managedAttributeStates: ManagedAttributeSearchStates =
        JSON.parse(value);
      return {
        f: field,
        o: managedAttributeStates.selectedOperator,
        v: managedAttributeStates.searchValue,
        t: type,
        d: managedAttributeStates?.selectedManagedAttribute?.id
      };

    // Treat all other types as just a string. No special rules.
    default:
      return {
        f: field,
        o: operator,
        v: value,
        t: type
      };
  }
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
  const children: any = simpleQueryGroup.p.map(
    (simpleQueryRow: SimpleQueryRow) => {
      // Handle dynamic field specific, they are stored differently.
      if (isDynamicFieldType(simpleQueryRow.t)) {
        return parseDynamicFields(simpleQueryRow);
      }

      return {
        id: Utils.uuid(),
        type: "rule",
        properties: {
          field: simpleQueryRow.f,
          operator: simpleQueryRow.o,
          value: [simpleQueryRow.v],
          valueSrc: ["value"],
          valueType: [simpleQueryRow.t]
        }
      };
    }
  );
  return {
    id: Utils.uuid(),
    type: "group",
    properties: {
      conjunction: parseConjunction(simpleQueryGroup.c)
    },
    children1: children
  };
}

/**
 * Parse the simplified dynamic fields back to their original format
 *
 * @param simpleQueryRow The simplified query row to parse
 * @returns A JsonTree rule node
 */
function parseDynamicFields(simpleQueryRow: SimpleQueryRow): any {
  switch (simpleQueryRow.t) {
    // Generate request

    // For managedAttribute type, reconstruct the state object
    case "managedAttribute":
      // Create the managedAttribute state object
      const managedAttributeState: ManagedAttributeSearchStates = {
        searchValue: simpleQueryRow.v,
        selectedOperator: simpleQueryRow.o,
        selectedType: "",
        preloadId: simpleQueryRow.d
      };

      return {
        id: Utils.uuid(),
        type: "rule",
        properties: {
          field: simpleQueryRow.f,
          // Always use noOperator for managed attributes in query builder
          operator: "noOperator",
          // Serialize the state back to string
          value: [JSON.stringify(managedAttributeState)],
          valueSrc: ["value"],
          valueType: [simpleQueryRow.t]
        }
      };

    // For all other dynamic field types
    default:
      return {
        id: Utils.uuid(),
        type: "rule",
        properties: {
          field: simpleQueryRow.f,
          operator: simpleQueryRow.o,
          value: [simpleQueryRow.v],
          valueSrc: ["value"],
          valueType: [simpleQueryRow.t]
        }
      };
  }
}
