import { KitsuResource } from "kitsu";

export type Strategies = "TYPE_BASED" | "DIRECT_PARENT";
export type CharacterTypes = "NUMBER" | "LOWER_LETTER" | "UPPER_LETTER";

export interface MaterialSampleIdentifierGeneratorAttributes {
  type: "material-sample-identifier-generator";

  /** The "split from" UUID. */
  currentParentUUID: string;

  /** The strategy to perform on the current parent UUID. */
  strategy: Strategies;

  /** Material Sample Type */
  materialSampleType?: string;

  /** Character type strategy (-1, -a, -A) */
  characterType: CharacterTypes;

  /** Amount of identifiers to be generated */
  amount: number;

  // Result returned, not postable.
  nextIdentifiers?: string[];
}

export type MaterialSampleIdentifierGenerator = KitsuResource &
  MaterialSampleIdentifierGeneratorAttributes;
