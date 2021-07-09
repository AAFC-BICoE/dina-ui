import { KitsuResource } from "kitsu";

export interface MolecularSampleAttributes {
  type: "molecular-sample";
  name: string;
  version: string;

  // Optional Fields
  group?: string;
  sampleType?: string;
  notes?: string;
  dateDiscarded?: string;
  discardedNotes?: string;
  lastModified?: string;
}

export type MolecularSample = KitsuResource & MolecularSampleAttributes;
