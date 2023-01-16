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
