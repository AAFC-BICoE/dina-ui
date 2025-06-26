import {
  GroupProperties,
  ImmutableTree,
  JsonTree,
  Utils
} from "@react-awesome-query-builder/ui";
import { SimpleQueryGroup, SimpleQueryRow } from "./types";
import { isDynamicFieldType } from "../types";
import { ManagedAttributeSearchStates } from "../query-builder/query-builder-value-types/QueryBuilderManagedAttributeSearch";
import { RelationshipPresenceSearchStates } from "../query-builder/query-builder-value-types/QueryBuilderRelationshipPresenceSearch";
import { FieldExtensionSearchStates } from "../query-builder/query-builder-value-types/QueryBuilderFieldExtensionSearch";
import { IdentifierSearchStates } from "../query-builder/query-builder-value-types/QueryBuilderIdentifierSearch";
import { ClassificationSearchStates } from "../query-builder/query-builder-value-types/QueryBuilderClassificationSearch";

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
 * Instead of displaying noOperator, take it from the state itself.
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
    // Managed Attributes
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

    // Field Extensions
    case "fieldExtension":
      const fieldExtensionStates: FieldExtensionSearchStates =
        JSON.parse(value);
      return {
        f: field,
        o: fieldExtensionStates.selectedOperator,
        v: fieldExtensionStates.searchValue,
        t: type,
        d: fieldExtensionStates.selectedExtension,
        d2: fieldExtensionStates.selectedField
      };

    // Identifiers
    case "identifier":
      const identifierStates: IdentifierSearchStates = JSON.parse(value);
      return {
        f: field,
        o: identifierStates.selectedOperator,
        v: identifierStates.searchValue,
        t: type,
        d: identifierStates?.selectedIdentifier?.id
      };

    case "classification":
      const classificationStates: ClassificationSearchStates =
        JSON.parse(value);
      return {
        f: field,
        o: classificationStates.selectedOperator,
        v: classificationStates.searchValue,
        t: type,
        d: classificationStates.selectedClassificationRank
      };

    // Relationship Presence
    case "relationshipPresence":
      const relationshipPresenceStates: RelationshipPresenceSearchStates =
        JSON.parse(value);
      return {
        f: field,
        o: relationshipPresenceStates.selectedOperator,
        v: relationshipPresenceStates.selectedRelationship,
        t: type
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

    // For fieldExtension type, reconstruct the state object
    case "fieldExtension":
      const fieldExtensionState: FieldExtensionSearchStates = {
        searchValue: simpleQueryRow.v,
        selectedOperator: simpleQueryRow.o,
        selectedExtension: simpleQueryRow.d ?? "",
        selectedField: simpleQueryRow.d2 ?? ""
      };

      return {
        id: Utils.uuid(),
        type: "rule",
        properties: {
          field: simpleQueryRow.f,
          operator: "noOperator",
          value: [JSON.stringify(fieldExtensionState)],
          valueSrc: ["value"],
          valueType: [simpleQueryRow.t]
        }
      };

    // For identifier type, reconstruct the state object
    case "identifier":
      const identifierState: IdentifierSearchStates = {
        searchValue: simpleQueryRow.v,
        selectedOperator: simpleQueryRow.o,
        selectedType: "",
        selectedIdentifier: {
          id: simpleQueryRow.d ?? "",
          type: "identifier-type",
          vocabularyElementType: "STRING"
        }
      };

      return {
        id: Utils.uuid(),
        type: "rule",
        properties: {
          field: simpleQueryRow.f,
          operator: "noOperator",
          value: [JSON.stringify(identifierState)],
          valueSrc: ["value"],
          valueType: [simpleQueryRow.t]
        }
      };

    // For classification type, reconstruct the state object
    case "classification":
      const classificationState: ClassificationSearchStates = {
        searchValue: simpleQueryRow.v,
        selectedOperator: simpleQueryRow.o,
        selectedClassificationRank: simpleQueryRow.d ?? ""
      };

      return {
        id: Utils.uuid(),
        type: "rule",
        properties: {
          field: simpleQueryRow.f,
          operator: "noOperator",
          value: [JSON.stringify(classificationState)],
          valueSrc: ["value"],
          valueType: [simpleQueryRow.t]
        }
      };

    // For relationshipPresence type, reconstruct the state object
    case "relationshipPresence":
      const relationshipPresenceState: RelationshipPresenceSearchStates = {
        selectedValue: 0,
        selectedOperator: simpleQueryRow.o,
        selectedRelationship: simpleQueryRow.v
      };

      return {
        id: Utils.uuid(),
        type: "rule",
        properties: {
          field: simpleQueryRow.f,
          operator: "noOperator",
          value: [JSON.stringify(relationshipPresenceState)],
          valueSrc: ["value"],
          valueType: [simpleQueryRow.t]
        }
      };

    // Log a warning for unsupported dynamic field types
    default:
      console.warn("Unsupported dynamic field for query URL parsing...");
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
