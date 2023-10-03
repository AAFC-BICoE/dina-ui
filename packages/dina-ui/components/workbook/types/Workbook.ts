import { WorkBookDataTypeEnum } from "./WorkBookDataTypeEnum";

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

export type Leaves<T> = { [K in string]: T | Leaves<T> } & {
  [K in keyof T]?: never;
};

export type FieldMappingConfigType = Leaves<FieldConfigType>;

export type FieldConfigType = {
  dataType: WorkBookDataTypeEnum;
  vocabularyEndpoint?: string;
  attributes?: FieldMappingConfigType;
  type?: string;
  baseApiPath?: string;
};
