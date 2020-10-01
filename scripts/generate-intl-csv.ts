import { COMMON_UI_MESSAGES_ENGLISH } from "../packages/common-ui/lib/intl/common-ui-en";
import { COMMON_UI_MESSAGES_FR } from "../packages/common-ui/lib/intl/common-ui-fr";
import { DINAUI_MESSAGES_ENGLISH } from "../packages/dina-ui/intl/dina-ui-en";
import { DINAUI_MESSAGES_FRENCH } from "../packages/dina-ui/intl/dina-ui-fr";
import { SEQDB_MESSAGES_ENGLISH } from "../packages/seqdb-ui/intl/seqdb-en";
import { SEQDB_MESSAGES_FRENCH } from "../packages/seqdb-ui/intl/seqdb-fr";
import { utils as sheetUtils } from "xlsx"

interface CsvRow {
  app: string;
  key: string;
  english: string;
  french: string;
}

type LANGUAGE = "en" | "fr";

const LANGUAGES: LANGUAGE[] = ["en", "fr"];

const MESSAGE_GROUPS = [
  {
    app: "common",
    en: COMMON_UI_MESSAGES_ENGLISH,
    fr: COMMON_UI_MESSAGES_FR
  },
  {
    app: "dina",
    en: DINAUI_MESSAGES_ENGLISH,
    fr: DINAUI_MESSAGES_FRENCH
  },
  {
    app: "seqdb",
    en: SEQDB_MESSAGES_ENGLISH,
    fr: SEQDB_MESSAGES_FRENCH
  }
];

const csvRows: CsvRow[] = [];

for (const messageGroup of MESSAGE_GROUPS) {
  const { app, en, fr } = messageGroup;

  // Collect the message keys from each app:
  const keys = LANGUAGES.reduce(
    (totalKeys: string[], lang) => [
      ...totalKeys,
      ...Object.keys(messageGroup[lang])
    ],
    []
  );

  const rows = keys.map<CsvRow>(key => ({
    app,
    key,
    english: en[key],
    french: fr[key]
  }));

  csvRows.push(...rows);
}

const sheet = sheetUtils.json_to_sheet(csvRows);
const csv = sheetUtils.sheet_to_csv(sheet);

process.stdout.write(csv);
