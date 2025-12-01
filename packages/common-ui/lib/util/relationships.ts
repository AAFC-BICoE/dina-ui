import { deepEqual } from "./deepEqual";
import _ from "lodash";

export interface NestedResourceConfig {
  /** The resource type for the nested resources (e.g., "identifier") */
  resourceType: string;
  /** API base URL for save operations */
  apiBaseUrl: string;
  /** 
   * Optional: Custom logic to determine if a nested resource has changed.
   * If not provided, uses _.isEqual comparison.
   */
  isModified?: (original: any, current: any) => boolean;
}

export interface RelationshipMapping {
  sourceAttribute: string;
  relationshipName: string;
  /**
   * Convert source value to JSON:API relationship data array.
   * Example for array input: (value) => value.map(v => ({ id: v.id, type: v.type }))
   * Example for single input: (value) => value ? [{ id: value.id, type: value.type }] : []
   */

  relationshipType: "SINGLE" | "ARRAY" | "CUSTOM";

  /** Optional custom converter for CUSTOM type */
  customRelationshipMapping?: (value: any) => Array<{ id: string; type: string }>;
  /** Remove the source attribute after moving it to relationships. */
  removeSourceAttribute?: boolean;
  
  /**
   * If specified, treats this relationship as a nested resource that needs:
   * - Saving new resources (POST)
   * - Updating modified resources (PATCH)
   * - Deleting removed resources (DELETE)
   */
  nestedResource?: NestedResourceConfig;
}


/**
 * Default converter based on relationshipType.
 */
function defaultConverter(type: "SINGLE" | "ARRAY"): (value: any) => Array<{ id: string; type: string }> {
  if (type === "SINGLE") {
    return (value) => (value ? [{ id: value.id, type: value.type }] : []);
  }
  return (value) =>
    Array.isArray(value) ? value.map((v) => ({ id: v.id, type: v.type })) : [];
}

export function applyRelationshipMappings(
  values: Record<string, any>,
  mappings: RelationshipMapping[]
): { nextValues: Record<string, any>; relationships: Record<string, any> } {
  const nextValues = { ...values };
  const relationships: Record<string, any> = {};


  for (const m of mappings) {
    const sourceValue = nextValues[m.sourceAttribute];
    const converter =
      m.customRelationshipMapping ??
      (m.relationshipType === "CUSTOM"
        ? () => {
            throw new Error(
              `CUSTOM type requires customRelationshipMapping for ${m.relationshipName}`
            );
          }
        : defaultConverter(m.relationshipType));

    const data = converter(sourceValue);
    relationships[m.relationshipName] = { data };

    if (m.removeSourceAttribute) {
      delete nextValues[m.sourceAttribute];
    }
  }

  // Keep all relationships, including empty ones
  return { nextValues, relationships };
}

/** 
 * Compute relationship diff against original.relationships (only changed ones).
 * 
 * @param originalRelationships - The original relationships from the API
 * @param newRelationships - The new relationships to compare
 * @returns Object containing only changed relationships, or undefined if none changed
 */
export function diffRelationships(
  originalRelationships: Record<string, any> | undefined,
  newRelationships: Record<string, any> | undefined
): Record<string, any> | undefined {
  if (!newRelationships) return undefined;
  
  // If no original relationships exist, this is a CREATE operation
  // Return all non-empty relationships
  if (!originalRelationships) {
    const nonEmpty: Record<string, any> = {};
    for (const [key, rel] of Object.entries(newRelationships)) {
      if (Array.isArray(rel.data) ? rel.data.length > 0 : rel.data !== null) {
        nonEmpty[key] = rel;
      }
    }
    return Object.keys(nonEmpty).length > 0 ? nonEmpty : undefined;
  }
  
  // This is an UPDATE operation - only include changed relationships
  const o = originalRelationships ?? {};
  const diff: Record<string, any> = {};

  // Check all relationships from newRelationships
  for (const key of Object.keys(newRelationships)) {
    const oRel = o[key]?.data ?? [];
    const nRel = newRelationships[key]?.data ?? [];
    
    // Check if this relationship has changed
    const hasChanged = !deepEqual(oRel, nRel);
    
    // For nested resources: only include in diff if they've changed
    // (processNestedResources handles the actual resource CRUD)
    // For regular relationships: only include if changed
    if (hasChanged) {
      diff[key] = { data: nRel };
    }
  }
  
  return Object.keys(diff).length ? diff : undefined;
}

/**
 * Process nested resources: save new/modified, delete removed.
 * Returns the updated values with saved nested resources.
 */
export async function processNestedResources(
  values: Record<string, any>,
  original: Record<string, any> | undefined,
  mappings: RelationshipMapping[],
  api: any
): Promise<Record<string, any>> {
  const processed = { ...values };

  for (const mapping of mappings) {
    if (!mapping.nestedResource) continue;

    const { sourceAttribute, nestedResource } = mapping;
    const { resourceType, apiBaseUrl, isModified = (o, c) => !_.isEqual(o, c) } = nestedResource;

    const currentResources = (processed[sourceAttribute] ?? []) as any[];
    const originalResources = (original?.[sourceAttribute] ?? []) as any[];

    // 1. Identify new resources (no id)
    const newResources = currentResources.filter(r => !r.id);

    // 2. Identify modified resources (has id and changed)
    const modifiedResources = currentResources.filter(r => {
      if (!r.id) return false;
      const orig = originalResources.find(o => o.id === r.id);
      return orig && isModified(orig, r);
    });

    // 3. Identify unchanged resources (has id and not changed)
    const unchangedResources = currentResources.filter(r => {
      if (!r.id) return false;
      return !modifiedResources.find(m => m.id === r.id);
    });

    // 4. Save new and modified resources
    const resourcesToSave = [...newResources, ...modifiedResources];
    let savedResources: any[] = [];
    
    if (resourcesToSave.length > 0) {
      const saveArgs = resourcesToSave.map(resource => ({
        resource,
        type: resourceType
      }));
      
      savedResources = await api.save(saveArgs, {
        apiBaseUrl,
        skipOperationForSingleRequest: true
      });
    }

    // 5. Identify and delete removed resources
    const currentIds = currentResources.filter(r => r.id).map(r => r.id);
    const removedResources = originalResources.filter(
      orig => orig.id && !currentIds.includes(orig.id)
    );

    if (removedResources.length > 0) {
      const deleteArgs = removedResources.map(resource => ({
        delete: resource
      }));
      
      await api.save(deleteArgs, { apiBaseUrl });
    }

    // 6. Update the processed values with all resources
    processed[sourceAttribute] = [...savedResources, ...unchangedResources];
  }

  return processed;
}
