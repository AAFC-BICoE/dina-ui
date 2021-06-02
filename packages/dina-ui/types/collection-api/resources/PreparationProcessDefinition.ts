import { KitsuResource } from "kitsu";
import { CollectingEvent } from "./CollectingEvent";
import { MaterialSample } from "./MaterialSample";

/** Form template config and default values. */
export interface FormTemplate<TFormValues> {
  allowNew: boolean;
  allowExisting: boolean;
  templateFields: TemplateFields<TFormValues>;
}

/** Map of form field names to template field config. */
export type TemplateFields<TFormValues = any> = {
  [Field in keyof TFormValues]: TemplateField<TFormValues[Field]> | undefined;
};

/** Configures one field in a form template. */
export interface TemplateField<TFieldType> {
  enabled: boolean;
  defaultValue: TFieldType;
}

export interface PreparationProcessDefinitionAttributes {
  type: "material-sample-action-definition";
  name: string;
  actionType: "ADD" | "SPLIT" | "MERGE";
  createdBy?: string;
  createdOn?: string;
  group: string;
  formTemplates: {
    COLLECTING_EVENT?: FormTemplate<CollectingEvent>;
    MATERIAL_SAMPLE?: FormTemplate<MaterialSample>;
  };
}

export type PreparationProcessDefinition = KitsuResource &
  PreparationProcessDefinitionAttributes;
