import { readFileSync, writeFileSync } from "fs";
import { readFile } from "xlsx";
import { MESSAGE_GROUPS } from "./intl-config";
import { importCsvMessages } from "./messages-csv-import";

const csvFilePath = process.argv[2];
const csvSheet = readFile(csvFilePath).Sheets.Sheet1;

importCsvMessages({
  csvSheet,
  messageGroups: MESSAGE_GROUPS,
  readFile: (file) => readFileSync(file).toString(),
  writeFile: writeFileSync
});
