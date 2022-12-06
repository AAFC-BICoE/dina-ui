import { WorkbookJSON } from "../types/Workbook";

/**
 * This is currently a pretty simple function but in the future you will be able to select the
 * sheet to get the headers from. For now this will simply just retrieve the first row with
 * content.
 *
 * @param spreadsheetData Whole spreadsheet data to retrieve the headers from.
 * @return An array of the columns from the spreadsheet. Null if no headers could be found.
 */
export function getColumnHeaders(spreadsheetData: WorkbookJSON) {
  return (
    spreadsheetData.find((rowData) => rowData.content.length !== 0)?.content ??
    null
  );
}
