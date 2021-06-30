import { KitsuResource } from "kitsu";
import { MaterialSample } from "../../collection-api";
import { Product } from "./Product";
import { Protocol } from "./Protocol";

export interface MolecularSampleAttributes {
  name: string;
  version: string;

  // Optional Fields
  group?: string;
  notes?: string;
  lastModified?: string;
}

export interface MolecularSampleRelationships {
  kit?: Product;
  protocol?: Protocol;
  materialSample?: MaterialSample;
}

export type MolecularSample = KitsuResource &
  MolecularSampleRelationships &
  MolecularSampleAttributes;
