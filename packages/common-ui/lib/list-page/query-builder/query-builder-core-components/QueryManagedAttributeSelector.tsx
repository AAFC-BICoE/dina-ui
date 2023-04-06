export type DynamicFieldType = "MANAGED_ATTRIBUTE" | "FIELD_EXTENSION";

export interface DynamicFieldsMappingConfig {
  /** Attribute level dynamic fields */
  fields: DynamicField[];

  /** Dynamic fields for relationships */
  relationshipFields: RelationshipDynamicField[];
}

export interface DynamicField {
  type: DynamicFieldType;
  path: string;

  /**
   * Optional field to indicate which Managed Attributes or Field Extensions should be listed.
   */
  component?: string;
}

/**
 * Configuration for where the Dynamic Field can be found within the relationship index mapping.
 */
export interface RelationshipDynamicField extends DynamicField {
  referencedBy: string;
}
