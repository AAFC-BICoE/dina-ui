import { DINAUI_MESSAGES_ENGLISH } from "packages/dina-ui/intl/dina-ui-en";

export interface MaterialSampleRunConfigMetadata {
  runby?: string;
  dateCreated?: string;
  actionRemarks: string;
}

export interface MaterialSampleRunConfigConfiguration {
  identifier: IdentifierType;
  numOfChildToCreate: number;
  baseName: string;

  generationMode: MaterialSampleGenerationMode;

  /** Starting suffix and suffixType for Series mode */
  start?: string | undefined;
  suffixType?: string | undefined;

  /** Suffix for Batch mode */
  suffix?: string;

  destroyOriginal: boolean;
}

export interface MaterialSampleRunConfigChildConfiguration {
  sampleNames?: string[];
}

export const MATERIAL_SAMPLE_GENERATION_MODES = ["BATCH", "SERIES"] as const;

export type MaterialSampleGenerationMode =
  typeof MATERIAL_SAMPLE_GENERATION_MODES[number];

export interface MaterialSampleRunConfigAttributes {
  metadata: MaterialSampleRunConfigMetadata;
  configure: MaterialSampleRunConfigConfiguration;
  configure_children?: MaterialSampleRunConfigChildConfiguration;
}

export const BASE_NAME = "ParentName";
export const START = "001";
export const TYPE_NUMERIC = "Numerical";
export const TYPE_LETTER = "Letter";
export const NUMERIC_UPPER_LIMIT = 30;

export type MaterialSampleRunConfig = MaterialSampleRunConfigAttributes;

export type IdentifierType = "MATERIAL_SAMPLE_ID" | "CATALOGUE_NUMBER";

export const IDENTIFIER_TYPE_OPTIONS: {
  labelKey: keyof typeof DINAUI_MESSAGES_ENGLISH;
  value: IdentifierType;
}[] = [
  {
    labelKey: "field_materialSample_identifierType_materialSampleId_label",
    value: "MATERIAL_SAMPLE_ID"
  },
  {
    labelKey: "field_materialSample_identifierType_catalogueNumber_label",
    value: "CATALOGUE_NUMBER"
  }
];
