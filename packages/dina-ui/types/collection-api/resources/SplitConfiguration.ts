import { KitsuResource } from "kitsu";

export const TYPE_BASED_STRATEGY = "TYPE_BASED";
export const DIRECT_PARENT_STRATEGY = "DIRECT_PARENT";

export type SplitStrategies =
  | typeof DIRECT_PARENT_STRATEGY
  | typeof TYPE_BASED_STRATEGY;

export const LOWER_CHARACTER_TYPE = "LOWER_LETTER";
export const UPPER_CHARACTER_TYPE = "UPPER_LETTER";
export const NUMBER_CHARACTER_TYPE = "NUMBER";

export type SplitCharacterTypes =
  | typeof LOWER_CHARACTER_TYPE
  | typeof UPPER_CHARACTER_TYPE
  | typeof NUMBER_CHARACTER_TYPE;

export const SEPARATORS_DASH = "DASH";
export const SEPARATORS_UNDERSCORE = "UNDERSCORE";
export const SEPARATORS_SPACE = "SPACE";

export type Separators =
  | typeof SEPARATORS_DASH
  | typeof SEPARATORS_UNDERSCORE
  | typeof SEPARATORS_SPACE;

export interface SplitConfigurationAttributes {
  type: "split-configuration";
  createdOn?: string;
  createdBy?: string;
  group?: string;
  name?: string;
  strategy?: SplitStrategies;
  conditionalOnMaterialSampleTypes?: string[];
  characterType?: SplitCharacterTypes;
  separator?: Separators;
  materialSampleTypeCreatedBySplit?: string;
}

export type SplitConfiguration = KitsuResource & SplitConfigurationAttributes;
