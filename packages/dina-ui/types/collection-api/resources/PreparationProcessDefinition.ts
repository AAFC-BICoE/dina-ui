import { z } from "zod";

// Define as Zod schemas instead of Typescript interfaces to enforce structure at runtime:

const templateFieldSchema = z.object({
  enabled: z.boolean(),
  defaultValue: z.unknown()
});

const templateFieldsSchema = z.record(
  z.string(),
  templateFieldSchema.optional()
);

const formTemplateSchema = z.object({
  allowNew: z.boolean().optional(),
  allowExisting: z.boolean().optional(),
  templateFields: templateFieldsSchema
});

export const materialSampleFormViewConfigSchema = z.object({
  type: z.literal("material-sample-form-custom-view"),
  formTemplates: z.object({
    COLLECTING_EVENT: formTemplateSchema.optional(),
    MATERIAL_SAMPLE: formTemplateSchema.optional(),
    ACQUISITION_EVENT: formTemplateSchema.optional()
  })
});

// Export typescript interfaces derived from the Zod schemas:

/** Form template config and default values. */
export type FormTemplate = z.infer<typeof formTemplateSchema>;

/** Map of form field names to template field config. */
export type TemplateFields = z.infer<typeof templateFieldsSchema>;

/** Configures one field in a form template. */
export type TemplateField = z.infer<typeof templateFieldSchema>;

export type MaterialSampleFormViewConfig = z.infer<
  typeof materialSampleFormViewConfigSchema
>;
