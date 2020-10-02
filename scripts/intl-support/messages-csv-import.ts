import { tsquery } from "@phenomnomnominal/tsquery";
import * as ts from "typescript";
import { Sheet, utils as sheetUtils } from "xlsx";
import { CsvRow, LANGUAGES, MessageDictionary } from "./intl-config";

interface ImportCsvMessagesParams {
  csvSheet: Sheet;
  messageGroups: MessageDictionary;
  readFile: (file: string) => string;
  writeFile: (file: string, text: string) => void;
}

/** Updates Typescript message source files using a given CSV sheet. */
export function importCsvMessages({
  csvSheet,
  messageGroups,
  readFile,
  writeFile
}: ImportCsvMessagesParams) {
  const csvRows = sheetUtils.sheet_to_json<CsvRow>(csvSheet);

  for (const app of Object.keys(messageGroups)) {
    const appConfig = messageGroups[app];
    for (const lang of LANGUAGES) {
      const messageGroup = appConfig[lang];

      const { file } = messageGroup;

      const srcCode = readFile(file);
      const srcCodeLines = srcCode.split("\n");
      const ast = tsquery.ast(srcCode);

      const appRows = csvRows.filter(row => row.app === app);

      for (const row of appRows) {
        const { key } = row;

        const [node] = tsquery(ast, `PropertyAssignment[name.name="${key}"]`);

        if (node && ts.isPropertyAssignment(node)) {
          const { initializer } = node;

          // Get the line + column position of the text to be replaced in the messages file:
          const {
            line: lineNumber,
            character: start
          } = ast.getLineAndCharacterOfPosition(initializer.getStart());
          const { length } = initializer.getText();

          // Replace the message in the .ts file with the one from the CSV:
          const newLineText = srcCodeLines[lineNumber].replace(
            RegExp(`(.{${start}}).{${length}}(.*)`),
            `$1"${row[lang]}"$2`
          );
          srcCodeLines[lineNumber] = newLineText;
        }
      }

      const newSrcFileText = srcCodeLines.join("\n");
      writeFile(file, newSrcFileText);
    }
  }
}
