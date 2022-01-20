import { KitsuResource } from "kitsu";

export interface SequenceGeneratorAttributes {
  type: "collection-sequence-generator";
  amount: number;
  result?: CollectionSequenceReserved;
}

export interface CollectionSequenceReserved {
  /**
   * Lowest reserved ID in the range.
   */
  lowReservedID: number;

  /**
   * Highest reserved ID in the range.
   */
  highReservedID: number;
}

export type SequenceGenerator = KitsuResource & SequenceGeneratorAttributes;
