import { KitsuResource } from "kitsu";
import { MaterialSample } from "../../collection-api";
import { Product } from "./Product";

export interface MolecularSampleAttributes {
  type: "molecular-sample";
  name: string;

  // Optional Fields
  group?: string;
}

export interface MolecularSampleRelationships {
  kit?: Product;
  materialSample?: MaterialSample;
}

export type MolecularSample = KitsuResource &
  MolecularSampleRelationships &
  MolecularSampleAttributes;
