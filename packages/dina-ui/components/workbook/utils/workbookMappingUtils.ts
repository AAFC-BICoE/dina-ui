import { WorkbookJSON } from "../types/Workbook";
import { find } from "lodash";

/**
 * This is currently a pretty simple function but in the future you will be able to select the
 * sheet to get the headers from. For now this will simply just retrieve the first row with
 * content.
 *
 * @param spreadsheetData Whole spreadsheet data to retrieve the headers from.
 * @param sheetNumber the sheet index (starting from 0) to pull the header columns from.
 * @return An array of the columns from the spreadsheet. Null if no headers could be found.
 */
export function getColumnHeaders(
  spreadsheetData: WorkbookJSON,
  sheetNumber: number
) {
  return (
    spreadsheetData?.[sheetNumber]?.find(
      (rowData) => rowData.content.length !== 0
    )?.content ?? null
  );
}

export function _toPlainString(value: string) {
  if (!!value) {
    return value.replace(/\s|-|_/g, "").toLowerCase();
  } else {
    return value;
  }
}

export function getSelectedValue(
  columnHeader: string,
  fieldOptions: {
    label: string;
    value: string;
  }[]
) {
  const option = find(
    fieldOptions,
    (item) => _toPlainString(item.label) === _toPlainString(columnHeader)
  );
  return option?.value;
}
