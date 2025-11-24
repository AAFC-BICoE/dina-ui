import { useCallback } from "react";
import { DinaFormOnSubmit } from "common-ui"; 
import { pickChangedFields, DiffOptions } from "../util/diffUtils";
import {
  applyRelationshipMappings,
  diffRelationships,
  RelationshipMapping
} from "../util/relationships";
import { bulkEditAllManagedAttributes } from "../util/bulkEditAllManagedAttributes";

export interface SaveOptions {
  apiBaseUrl: string;
  [k: string]: any;
}

export interface UseSubmitHandlerOptions<T extends Record<string, any>> {
  /** Original values (undefined if creating new) */
  original?: T;
  resourceType: string;
  saveOptions: SaveOptions;

  /** Async transforms to modify submittedValues before diffing/mapping */
  transforms?: Array<(values: T, api: any) => Promise<T> | T>;

  /** Configuration for your applyRelationshipMappings helper */
  relationshipMappings?: RelationshipMapping[];

  /** Configuration for your pickChangedFields helper */
  diffOptions?: DiffOptions;

  deletedManagedAttrFields?: Set<string>;

  beforeSave?: (payload: { resource: any; type: string }) => void | Promise<void>;
  onSuccess?: (saved: any) => void | Promise<void> | undefined;
  afterSave?: () => void | Promise<void>;

  /** 
   * Optional: Override the default api.save function. 
   * Useful for permission checks or custom saving logic.
   */
  saveFn?: (operations: any[], options: SaveOptions) => Promise<any[]>;
}

export function useSubmitHandler<T extends Record<string, any>>({
  original,
  resourceType,
  saveOptions,
  transforms = [],
  relationshipMappings = [],
  diffOptions,
  deletedManagedAttrFields = new Set(),
  beforeSave,
  onSuccess,
  afterSave,
  saveFn
}: UseSubmitHandlerOptions<T>) {

  // We return the function expected by DinaForm
  const onSubmit = useCallback(
    async ({ submittedValues, api }) => {

      try {
        // 1. RUN TRANSFORMS
        // e.g. Save Nested relationships asynchronously
        let processed: any = { ...submittedValues };
        for (const transform of transforms) {
          processed = await transform(processed, api);
        }

        // 2. MAP RELATIONSHIPS
        // Moves fields from 'processed' into 'relationships' based on mapping config
        const { nextValues, relationships } = applyRelationshipMappings(
          processed,
          relationshipMappings
        );
        processed = nextValues;

        // 3. DIFF ATTRIBUTES
        const attributesDiff = pickChangedFields(
          original ?? {}, 
          processed ?? {}, 
          diffOptions
        );

        // 4. DIFF MANAGED ATTRIBUTES
        if (processed.managedAttributes || original?.managedAttributes) {
          const managedAttrsDiff = bulkEditAllManagedAttributes(
            processed.managedAttributes || {},
            original?.managedAttributes || {},
            deletedManagedAttrFields,
            "managedAttributes"
          );
          // If managed attributes changed, add them to the main diff
          if (Object.keys(managedAttrsDiff).length > 0) {
            attributesDiff["managedAttributes"] = managedAttrsDiff;
          }
        }

        // 5. DIFF RELATIONSHIPS
        const relationshipDiff = diffRelationships(
          original?.relationships,
          relationships // These are the relationships generated in Step 2
        );

        // 6. SKIP IF EMPTY (Optional safety check)
        const isEmpty = 
          Object.keys(attributesDiff).length === 0 && 
          (!relationshipDiff || Object.keys(relationshipDiff).length === 0);

        // If creating record allow empty
        if (isEmpty && original?.id) {
            if (onSuccess) await onSuccess(original);
            return;
        }

        // 7. BUILD PAYLOAD
        const resource: any = {
          ...attributesDiff,
          type: resourceType
        };

        // Add ID if updating
        if (original?.id) {
          resource.id = original.id;
        }

        // Attach relationship diffs if any
        if (relationshipDiff) {
          resource.relationships = relationshipDiff;
        }

        const payloadOp = { resource, type: resourceType };

        // Hook for final payload inspection
        if (beforeSave) await beforeSave(payloadOp);

        // 8. SAVE
        const [saved] = await api.save([payloadOp], saveOptions);

        // 9. POST-SAVE
        if (onSuccess) await onSuccess(saved);
        if (afterSave) await afterSave();
        
        return saved;

      } catch (error) {
        console.error("Submit Handler Error:", error);
        throw error; // Re-throw so DinaForm handles the UI error state
      }
    },
    [
      original,
      resourceType,
      saveOptions,
      transforms,
      relationshipMappings,
      diffOptions,
      deletedManagedAttrFields,
      beforeSave,
      onSuccess,
      afterSave,
      saveFn
    ]
  ) as unknown as DinaFormOnSubmit;

  return onSubmit;
}