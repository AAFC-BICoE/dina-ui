import { tsquery } from "@phenomnomnominal/tsquery";
import * as ts from "typescript";
import { Sheet, utils as sheetUtils } from "xlsx";
import { CsvRow, LANGUAGES, MessageDictionary } from "./intl-config";
import _ from "lodash";

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

  // Loop through the different Apps (common/seqdb/dina):
  for (const app of Object.keys(messageGroups)) {
    const appConfig = messageGroups[app];

    // Loop through languages (en/fr):
    for (const lang of LANGUAGES) {
      // Get the filename + messages for this app and language:
      const { file, messages } = appConfig[lang];

      const appRows = csvRows.filter((row) => row.app === app);

      let newMessages = { ...messages };

      // Loop through the CSV rows to construct the new messages object:
      for (const row of appRows) {
        const newMessage = row[lang];

        if (newMessage) {
          const { key } = row;
          newMessages[key] = newMessage;
        }
      }

      // Sort the entries before write to file
      const newMessagesArray = _.toPairs(newMessages);
      newMessages = _.fromPairs(newMessagesArray.sort());

      // Parse the Typescript message file:
      const srcCode = readFile(file);
      const ast = tsquery.ast(srcCode);

      // Assume the first ObjectLiteralExpression ("{}") in the file is the message object:
      const [node] = tsquery(ast, `ObjectLiteralExpression`);

      // Use a string replacement in the source messages file to swap in the new messages object:
      if (node && ts.isObjectLiteralExpression(node)) {
        const start = node.getStart();
        const length = node.end - start;
        const newSrcFileText = srcCode.replace(
          // Matches the ObjectLiteralExpression based on start/end positions:
          RegExp(`([\\s\\S]{${start}})[\\s\\S]{${length}}([\\s\\S]*)`),
          // Pretty prints Json in its place:
          `$1${JSON.stringify(newMessages, null, 2)}$2`
        );
        writeFile(file, newSrcFileText);
      }
    }
  }
}
