import { z } from "zod";
// Define as Zod schemas instead of Typescript interfaces to enforce structure at runtime:

const templateFieldSchema = z.object({
  enabled: z.boolean(),
  defaultValue: z.unknown()
});

const templateFieldMapSchema = z.record(
  z.string(),
  templateFieldSchema.optional()
);

const formTemplateSchema = z.object({
  allowNew: z.boolean().optional(),
  allowExisting: z.boolean().optional(),
  templateFields: templateFieldMapSchema
});

export const materialSampleFormTemplateSchema = z.object({
  type: z.literal("material-sample-form-template"),
  managedAttributesOrder: z.string().array().optional(),
  determinationManagedAttributesOrder: z.string().array().optional(),
  collectingEventManagedAttributesOrder: z.string().array().optional(),
  formTemplate: z.object({
    COLLECTING_EVENT: formTemplateSchema.optional(),
    MATERIAL_SAMPLE: formTemplateSchema.optional()
  })
});

// Export typescript interfaces derived from the Zod schemas:

/** Form template config and default values. */
export type FormTemplateConfig = z.infer<typeof formTemplateSchema>;

/** Map of form field names to template field config. */
export type TemplateFieldMap = z.infer<typeof templateFieldMapSchema>;

/** Configures one field in a form template. */
export type TemplateField = z.infer<typeof templateFieldSchema>;

export type MaterialSampleFormTemplateConfig = z.infer<
  typeof materialSampleFormTemplateSchema
>;
