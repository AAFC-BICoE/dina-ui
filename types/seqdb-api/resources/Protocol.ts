import { KitsuResource } from "kitsu";
import { Group } from "./Group";
import { Product } from "./Product";
export interface ProtocolAttributes {
  type: string;
  name: String;
  version?: String;
  description?: String;
  steps?: String;
  notes?: String;
  reference?: String;
  equipment?: String;
  forwardPrimerConcentration?: String;
  reversePrimerConcentration?: String;
  reactionMixVolume?: String;
  reactionMixVolumePerTube?: String;
  lastModified?: String;
}

export interface ProtocolRelationships {
  group: Group;
  kit?: Product;
}

export type Protocol = KitsuResource &
  ProtocolAttributes &
  ProtocolRelationships;
