import { KitsuResource } from "kitsu";
import { ProtocolTypes } from "./ProtocolTypes";
export interface ProtocolAttributes {
    type: ProtocolTypes
    name: String
    version: String
    description: String
    steps: String
    notes: String
    reference: String
    equipment: String
    forwardPrimerConcentration: String
    reversePrimerConcentration: String
    reactionMixVolume: String
    reactionMixVolumePerTube: String
}

export type Protocol = KitsuResource &
    ProtocolAttributes
