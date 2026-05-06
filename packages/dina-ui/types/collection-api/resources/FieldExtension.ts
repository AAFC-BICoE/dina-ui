import { KitsuResource } from "kitsu";
import { MultilingualDescription } from "../../common";
import { MultilingualTitle } from "./VocabularyElement";

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
  name: string;
  term: string;
  unit: string;
  vocabularyElementType: string;
  definition: string;
  dinaComponent: string;
  acceptedValues: string[];
  multilingualDescription: MultilingualDescription;
  multilingualTitle: MultilingualTitle;
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
