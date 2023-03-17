export const TYPE_BASED_STRATEGY = "TYPE_BASED";
export const DIRECT_PARENT_STRATEGY = "DIRECT_PARENT";

export const LOWER_CHARACTER_TYPE = "LOWER_LETTER";
export const UPPER_CHARACTER_TYPE = "UPPER_LETTER";
export const NUMBER_CHARACTER_TYPE = "NUMBER";

export type SplitStrategies =
  | typeof DIRECT_PARENT_STRATEGY
  | typeof TYPE_BASED_STRATEGY;
export type SplitCharacterTypes =
  | typeof LOWER_CHARACTER_TYPE
  | typeof UPPER_CHARACTER_TYPE
  | typeof NUMBER_CHARACTER_TYPE;

export interface SplitConfiguration {
  condition: SplitConfigurationCondition;
  materialSampleNameGeneration: SplitConfigurationMaterialSampleNameGeneration;
}

export interface SplitConfigurationCondition {
  conditionType: typeof TYPE_BASED_STRATEGY;
  materialSampleType?: string[];
}

export interface SplitConfigurationMaterialSampleNameGeneration {
  strategy: SplitStrategies;
  characterType: SplitCharacterTypes;

  // If the strategy is material sample type then this will be provided here.
  materialSampleType?: string;
}
