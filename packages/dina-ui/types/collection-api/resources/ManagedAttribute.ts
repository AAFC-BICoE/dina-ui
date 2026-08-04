import { KitsuResource } from "kitsu";
import { MultilingualDescription } from "../../common";
import { HasDinaMetaInfo } from "../../DinaJsonMetaInfo";
import { VocabularyElementType } from "./VocabularyElementType";

export interface ManagedAttributeAttributes<TComponent = string> {
  type: "managed-attribute";
  name: string;
  vocabularyElementType: VocabularyElementType;
  unit?: string;
  managedAttributeComponent?: TComponent;
  acceptedValues?: string[] | null;
  key: string;
  group?: string;
  createdBy?: string;
  createdOn?: string;
  multilingualDescription?: MultilingualDescription;
}

export type ManagedAttribute<TComponent = string> = KitsuResource &
  ManagedAttributeAttributes<TComponent> &
  HasDinaMetaInfo;

export type ManagedAttributeValues = {
  [managedAttributeId: string]: string;
};
