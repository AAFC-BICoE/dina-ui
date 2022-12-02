/**
 * Data returned from the Excel to JSON API from the object store module API.
 */
export interface WorkbookRow {
  id: number;
  rowNumber: number;
  content: string[];
}

/**
 * JSON workbook contains an array of rows, defined as a Workbook Row.
 */
export interface WorkbookJSON extends Array<WorkbookRow> {}
