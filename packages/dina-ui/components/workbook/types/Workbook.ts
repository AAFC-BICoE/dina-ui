import { WorkbookDataTypeEnum } from "./WorkbookDataTypeEnum";

/**
 * A specific row on a spreadsheet.
 */
export interface WorkbookRow {
  rowNumber: number;
  content: string[];
}

/**
 * A spreadsheet can contain multiple sheets, each sheet has an array of rows.
 */
export interface WorkbookJSON {
  [sheetNumber: number]: WorkbookRow[];
}

export type Leaves<T> = { [K: string]: T | Leaves<T> } | { type: string };

// export type FieldMappingConfigType = Leaves<FieldConfigType>;

export type FieldMappingConfigType = {
  [key: string]: {
    type: string;
  } & Leaves<FieldConfigType>;
};

export interface PrimitiveField {
  dataType:
    | WorkbookDataTypeEnum.NUMBER
    | WorkbookDataTypeEnum.BOOLEAN
    | WorkbookDataTypeEnum.STRING
    | WorkbookDataTypeEnum.DATE
    | WorkbookDataTypeEnum.STRING_ARRAY
    | WorkbookDataTypeEnum.NUMBER_ARRAY
    | WorkbookDataTypeEnum.BOOLEAN_ARRAY;
}

export interface ManagedAttributeField {
  dataType: WorkbookDataTypeEnum.MANAGED_ATTRIBUTES;
}

export interface VocabularyField {
  dataType: WorkbookDataTypeEnum.VOCABULARY;
  vocabularyEndpoint: string;
}

export interface ObjectField {
  dataType: WorkbookDataTypeEnum.OBJECT | WorkbookDataTypeEnum.OBJECT_ARRAY;
  attributes: Leaves<FieldConfigType>;
  relationships?: {
    type: string;
    hasGroup: boolean;
    tryToLinkExisting: boolean;
    baseApiPath?: string;
  };
}

export type FieldConfigType =
  | PrimitiveField
  | VocabularyField
  | ManagedAttributeField
  | ObjectField;
