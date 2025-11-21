import { useCallback } from "react";

export interface SaveOptions {
  apiBaseUrl: string;
  [k: string]: any;
}

export interface UseSubmitHandlerOptions<T extends Record<string, any>> {
  original: T;
  edited: T;
  resourceType: string;
  saveOptions: SaveOptions;

  /** Some transforms may be needed.. */
  transforms?: Array<(values: T) => Promise<T> | T>;

  /** Relationship mappings for attribute → relationship conversion. */
  // This will assist with relationship mapping and relationship diffing
  relationshipMappings?:

  /** Diff options for attributes. */
  // this will assist with diffing. Could include ignoreKeys, customHandlers, etc.
  diffOptions?:

  /** Deleted managed attribute keys (bulk edit scenario). */
  deletedManagedAttrFields?: Set<string>;

  /** Hook before save to mutate payload (e.g., sequence generation). */
  beforeSave?: (payload: { resource: any; type: string }) => Promise<void>;

  /** Called after successful save. */
  onSuccess?: (saved: any) => Promise<void>;

  /** Called after save for cleanup (e.g., delete extra records). */
  afterSave?: () => Promise<void>;

  /** Skip save if nothing changed and resource has an ID. */
  skipWhenEmptyWithId?: boolean;

  /** If skipped, still call onSuccess. */
  callOnSuccessWhenSkipped?: boolean;

  /** Save function (Dina save). */
  saveFn: (
    operations: any[],
    options: SaveOptions
  ) => Promise<any[]>; // returns array of saved resources
}

export function useSubmitHandler<T extends Record<string, any>>({
  original,
  edited,
  resourceType,
  saveOptions,
  transforms = [],
  relationshipMappings = [],
  diffOptions,
  deletedManagedAttrFields = new Set(),
  beforeSave,
  onSuccess,
  afterSave,
  skipWhenEmptyWithId = false,
  callOnSuccessWhenSkipped = false,
  saveFn
}: UseSubmitHandlerOptions<T>) {
  return useCallback(async () => {
    // Flow..
    // 1) Apply transforms pipeline
    
    // 2) Apply relationship mappings
    
    // 3) Managed attributes mapping (can use bulkEditAllManagedAttributes)
    
    // 4) Attribute diff

    // 5) Relationship diff

    // 6) Skip if nothing changed

    // 7) Build payload
    const resource: any = {
      id: original?.id,
      type: resourceType,
      ...attributesDiff
    };
    if (relationshipDiff && Object.keys(relationshipDiff).length > 0) {
      resource.relationships = relationshipDiff;
    }

    const payloadOp = { resource, type: resourceType };

    // 8) beforeSave hook
    if (beforeSave) {
      await beforeSave(payloadOp);
    }

    // 9) Save
    const [saved] = await saveFn([payloadOp], saveOptions);

    // 10) Post-save hooks
    if (onSuccess) await onSuccess(saved);
    if (afterSave) await afterSave();

    return saved;
  }, [
    original,
    edited,
    resourceType,
    saveOptions,
    transforms,
    relationshipMappings,
    diffOptions,
    deletedManagedAttrFields,
    beforeSave,
    onSuccess,
    afterSave,
    skipWhenEmptyWithId,
    callOnSuccessWhenSkipped,
    saveFn
  ]);
}