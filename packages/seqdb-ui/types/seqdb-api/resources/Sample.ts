import { KitsuResource } from "kitsu";

export interface SampleAttributes {
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

export type Sample = KitsuResource & SampleAttributes;
