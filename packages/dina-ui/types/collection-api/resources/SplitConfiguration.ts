export type SplitSupportedTypes = "DIRECT_PARENT" | "MATERIAL_SAMPLE_TYPE";
export type SplitSupportedModes = "LOWERCASE" | "UPPERCASE" | "NUMERICAL";

export interface SplitConfiguration {
  condition: SplitConfigurationCondition;
  basename: SplitConfigurationBasename;
  sequenceGeneration: SplitConfigurationSequenceGeneration;
}

export interface SplitConfigurationCondition {
  conditionOn: SplitSupportedTypes;
  materialSampleType?: string[];
}

export interface SplitConfigurationBasename {
  generateFrom: SplitSupportedTypes;
  materialSampleType?: string[];
}

export interface SplitConfigurationSequenceGeneration {
  generateFrom: SplitSupportedTypes;
  materialSampleType?: string[];
  generationMode: SplitSupportedModes;
}
