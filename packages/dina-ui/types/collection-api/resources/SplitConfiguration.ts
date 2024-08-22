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

export const SEPARATOR_DASH = "-";
export const SEPARATOR_UNDERSCORE = "_";
export const SEPARATOR_SPACE = " ";

export type Separators =
  | typeof SEPARATOR_DASH
  | typeof SEPARATOR_UNDERSCORE
  | typeof SEPARATOR_SPACE;

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
