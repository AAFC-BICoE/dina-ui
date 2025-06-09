import _ from "lodash";
import { CsvRow, LANGUAGES, MessageDictionary } from "./intl-config";
import { utils as sheetUtils } from "xlsx";

/** Converts a MessageDictionary to a CSV-formatted string. */
export function messagesToCsv(messageDictionary: MessageDictionary): string {
  const csvRows: CsvRow[] = [];

  for (const app of Object.keys(messageDictionary)) {
    const appConfig = messageDictionary[app];

    // Collect the message keys from each app:
    const keysWithDuplicates = LANGUAGES.reduce(
      (totalKeys: string[], lang) => [
        ...totalKeys,
        ...Object.keys(appConfig[lang].messages)
      ],
      []
    );

    const keys = _.uniq(keysWithDuplicates);

    const { english, french } = appConfig;

    const rows = keys.map<CsvRow>((key) => ({
      app,
      key,
      english: english.messages[key],
      french: french.messages[key]
    }));

    csvRows.push(...rows);
  }

  const sheet = sheetUtils.json_to_sheet(csvRows);
  const csv = sheetUtils.sheet_to_csv(sheet);

  return csv;
}
