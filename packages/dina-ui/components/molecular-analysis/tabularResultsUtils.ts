import { TabularResults } from "../../types/seqdb-api/resources/molecular-analysis/MolecularAnalysisResult";
import { WorkbookJSON } from "../workbook/types/Workbook";

/** Message key describing why a file can't be used as tabular results. */
export type TabularResultsError =
  | "tabularResults_errorUnreadable"
  | "tabularResults_errorEmpty"
  | "tabularResults_errorInvalidCharacters"
  | "tabularResults_errorColumns"
  | "tabularResults_errorNoRows";

/**
 * Converts the workbook converter output (first sheet; first row = headers) into the
 * `tabularResults` shape stored on a MolecularAnalysisResult. Headers are kept exactly as in
 * the file. Returns the error message key when the file can't be used.
 */
export function toTabularResults(
  workbook: WorkbookJSON | undefined
): TabularResults | TabularResultsError {
  // The converter returns undefined when it couldn't read the file.
  if (!workbook) {
    return "tabularResults_errorUnreadable";
  }

  const rows = workbook[0]?.rows ?? [];
  if (!rows.length) {
    return "tabularResults_errorEmpty";
  }

  // Postgres jsonb can't store NUL characters, so the save would fail.
  if (rows.some((row) => row.content?.some((cell) => cell?.includes("\0")))) {
    return "tabularResults_errorInvalidCharacters";
  }

  const headers = rows[0].content ?? [];
  if (headers.filter((header) => header?.trim()).length < 2) {
    return "tabularResults_errorColumns";
  }

  const records = rows
    .slice(1)
    .filter((row) => row.content?.some((cell) => cell?.trim()))
    .map((row) => {
      const record: Record<string, string> = {};
      headers.forEach((header, index) => {
        if (header?.trim()) {
          record[header] = row.content[index] ?? "";
        }
      });
      return record;
    });

  return records.length ? { records } : "tabularResults_errorNoRows";
}
