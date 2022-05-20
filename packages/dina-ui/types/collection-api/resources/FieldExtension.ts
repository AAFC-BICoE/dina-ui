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
  acceptedValues: string[];
};

export type FieldExtension = KitsuResource & FieldExtensionAttributes;

export type ExtensionValue = {
  extKey?: string;
  extVersion?: string;
  extTerm?: string;
  value?: string;
};
