import { KitsuResource } from "kitsu";

export interface FieldExtensionAttributes {
  type: "extenstion";
  extension: {
    name: string;
    key: string;
    version: string;
    fields: ExtensionField[];
  };
}

export type ExtensionField = {
  term: string;
  name: string;
  definition: string;
  dinaComponent: string;
};

export type FieldExtension = KitsuResource & FieldExtensionAttributes;
