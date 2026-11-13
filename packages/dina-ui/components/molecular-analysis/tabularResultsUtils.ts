import { TabularResults } from "../../types/seqdb-api/resources/molecular-analysis/MolecularAnalysisResult";
import { WorkbookJSON } from "../workbook/types/Workbook";

/**
 * Converts the workbook converter output (first sheet; first row = headers) into the
 * `tabularResults` shape stored on a MolecularAnalysisResult. Headers are kept exactly as in
 * the file. Returns undefined when the file can't be used (fewer than 2 columns or 2 lines).
 */
export function toTabularResults(
  workbook: WorkbookJSON | undefined
): TabularResults | undefined {
  const rows = workbook?.[0]?.rows;
  if (!rows || rows.length < 2) {
    return undefined;
  }

  const headers = rows[0].content ?? [];
  if (headers.filter((header) => header?.trim()).length < 2) {
    return undefined;
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

  return records.length ? { records } : undefined;
}
