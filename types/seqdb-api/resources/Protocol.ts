import { KitsuResource } from "kitsu";
import { Group } from "./Group";
import { Product } from "./Product";
import { ProtocolTypes } from "./ProtocolTypes";
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

export const findProtocolValue = (key) => {

  var protocolVal;
  switch (key) {
    case "COLLECTION_EVENT":
      protocolVal = ProtocolTypes.COLLECTION_EVENT;
      break;
    case "DNA_EXTRACTION":
      protocolVal = ProtocolTypes.DNA_EXTRACTION;
      break;
    case "PCR_REACTION":
      protocolVal = ProtocolTypes.PCR_REACTION;
      break;
    case "SEQ_REACTION":
      protocolVal = ProtocolTypes.SEQ_REACTION;
      break;
    case "SPECIMEN_PREPARATION":
      protocolVal = ProtocolTypes.SPECIMEN_PREPARATION;
      break;
    default:
      protocolVal = ProtocolTypes.COLLECTION_EVENT;
  }
  return protocolVal;
}