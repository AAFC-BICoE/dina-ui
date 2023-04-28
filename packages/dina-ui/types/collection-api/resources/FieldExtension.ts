import { KitsuResource } from "kitsu";

export interface FieldExtensionAttributes {
  type: "extension";
  extension: {
    name: string;
    key: string;
    version: string;
    fields: ExtensionField[];
  };
}

export type ExtensionField = {
  key: string;
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

export type FieldExtensionValue = {
  type: "field-extension-value";
  id: string;
  extensionName: string;
  extensionKey: string;
  field: ExtensionField;
};
