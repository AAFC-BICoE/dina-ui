import { KitsuResource } from "kitsu";

export interface SampleAttributes {
  name: string;
  version: string;

  // Optional Fields
  sampleType?: string;
  experimenter?: string;
  versionDescription?: string;
  treatment?: string;
  source?: string;
  dnaConcentration?: string;
  dnaConcentrationNotes?: string;
  dnaConcentrationPerStartMaterial?: string;
  date?: string;
  nuclAcidExt?: string;
  extractionBatch?: string;
  pelletSize?: number;
  lysisBufferVolume?: number;
  proteinaseKVolume?: number;
  qubitDNAConcentration?: number;
  ratio260_280?: number;
  ratio260_230?: number;
  quantificationMethod?: string;
  growthMedia?: string;
  dnaNotes?: string;
  notes?: string;
  tubeId?: string;
  unusableDna?: boolean;
  inoculationDate?: string;
  fraction?: string;
  fermentationTemperature?: number;
  fermentationTime?: string;
  extractionSolvent?: string;
  dateDiscarded?: string;
  discardedNotes?: string;
  lastModified?: string;
}

export type Sample = KitsuResource & SampleAttributes;
