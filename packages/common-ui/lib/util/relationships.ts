import { deepEqual } from "./deepEqual";

export interface RelationshipMapping {
  sourceAttribute: string;
  relationshipName: string;
  /**
   * Convert source value to JSON:API relationship data array.
   * Example for array input: (value) => value.map(v => ({ id: v.id, type: v.type }))
   * Example for single input: (value) => value ? [{ id: value.id, type: value.type }] : []
   */
  toRelationshipData: (value: any) => Array<{ id: string; type: string }>;
  /** Remove the source attribute after moving it to relationships. */
  removeSourceAttribute?: boolean;
}

export function applyRelationshipMappings(
  values: Record<string, any>,
  mappings: RelationshipMapping[]
): { nextValues: Record<string, any>; relationships: Record<string, any> } {
  const nextValues = { ...values };
  const relationships: Record<string, any> = {};

  for (const m of mappings) {
    const sourceValue = (nextValues as any)[m.sourceAttribute];
    const data = m.toRelationshipData(sourceValue);

    relationships[m.relationshipName] = { data };
    if (m.removeSourceAttribute) {
      delete (nextValues as any)[m.sourceAttribute];
    }
  }

  // Only include non-empty relationships
  const pruned: Record<string, any> = {};
  for (const k of Object.keys(relationships)) {
    const rel = relationships[k];
    if (Array.isArray(rel?.data)) {
      // keep even empty arrays if semantically needed; here we drop empties:
      if (rel.data.length > 0) pruned[k] = rel;
    }
  }

  return { nextValues, relationships: pruned };
}

/** Compute relationship diff against original.relationships (only changed ones). */
export function diffRelationships(
  originalRelationships: Record<string, any> | undefined,
  newRelationships: Record<string, any> | undefined
): Record<string, any> | undefined {
  if (!newRelationships) return undefined;
  const o = originalRelationships ?? {};
  const diff: Record<string, any> = {};

  for (const key of Object.keys(newRelationships)) {
    const oRel = o[key]?.data ?? [];
    const nRel = newRelationships[key]?.data ?? [];
    if (!deepEqual(oRel, nRel)) {
      diff[key] = { data: nRel };
    }
  }

  return Object.keys(diff).length ? diff : undefined;
}
