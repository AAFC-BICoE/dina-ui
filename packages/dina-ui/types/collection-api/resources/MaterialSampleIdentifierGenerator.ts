import { KitsuResource } from "kitsu";
import {
  Separators,
  SplitStrategies,
  SplitCharacterTypes
} from "./SplitConfiguration";

export interface MaterialSampleIdentifierGeneratorAttributes {
  type: "material-sample-identifier-generator";

  /** The "split from" UUID. */
  currentParentUUID?: string;

  currentParentsUUID?: string[];

  /** The strategy to perform on the current parent UUID. */
  strategy: SplitStrategies;

  /** Material Sample Type */
  materialSampleType?: string;

  /** Character type strategy (-1, -a, -A) */
  characterType: SplitCharacterTypes;

  /** Separators to use in name generation (dash, underscore, space) */
  separator: Separators;

  /** Amount of identifiers to be generated */
  quantity?: number;

  // Result returned, not postable.
  nextIdentifiers?: Record<string, string[]>;
}

export type MaterialSampleIdentifierGenerator = KitsuResource &
  MaterialSampleIdentifierGeneratorAttributes;
