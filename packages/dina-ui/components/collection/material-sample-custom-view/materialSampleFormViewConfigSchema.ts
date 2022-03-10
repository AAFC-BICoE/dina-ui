import { z } from "zod";
import { MATERIAL_SAMPLE_FORM_SECTIONS } from "../../../types/collection-api";

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

export const materialSampleFormCustomViewSchema = z.object({
  type: z.literal("material-sample-form-custom-view"),
  navOrder: z
    .enum(MATERIAL_SAMPLE_FORM_SECTIONS)
    .array()
    // Fallback to null:
    .or(z.any().transform(() => null)),
  managedAttributesOrder: z.string().array().optional(),
  determinationManagedAttributesOrder: z.string().array().optional(),
  collectingEventManagedAttributesOrder: z.string().array().optional(),
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
export type TemplateFieldMap = z.infer<typeof templateFieldMapSchema>;

/** Configures one field in a form template. */
export type TemplateField = z.infer<typeof templateFieldSchema>;

export type MaterialSampleFormCustomViewConfig = z.infer<
  typeof materialSampleFormCustomViewSchema
>;
