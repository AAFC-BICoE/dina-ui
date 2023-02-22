export type SplitSupportedTypes = "direct_parent" | "type";
export type SplitSupportedModes = "lowercase" | "uppercase" | "numerical";

export interface SplitConfiguration {
  condition: SplitConfigurationCondition;
  basename: SplitConfigurationBasename;
  sequenceGeneration: SplitConfigurationSequenceGeneration;
}

export interface SplitConfigurationCondition {
  conditionOn: Omit<"DIRECT_PARENT", SplitSupportedTypes>;
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
