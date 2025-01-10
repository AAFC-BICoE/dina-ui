import { join } from "path";

/* eslint-disable @typescript-eslint/no-require-imports */
const {
  COMMON_UI_MESSAGES_ENGLISH
} = require("../../common-ui/lib/intl/common-ui-en");
const {
  COMMON_UI_MESSAGES_FR
} = require("../../common-ui/lib/intl/common-ui-fr");
const { DINAUI_MESSAGES_ENGLISH } = require("../../dina-ui/intl/dina-ui-en");
const { DINAUI_MESSAGES_FRENCH } = require("../../dina-ui/intl/dina-ui-fr");
const { SEQDB_MESSAGES_ENGLISH } = require("../../dina-ui/intl/seqdb-en");
const { SEQDB_MESSAGES_FRENCH } = require("../../dina-ui/intl/seqdb-fr");

// Type definitions and message file locations for exporting/importing app messages using CSV spreadsheets:

export interface CsvRow {
  app: string;
  key: string;
  english?: string;
  french?: string;
}

export type MessageDictionary = Record<string, AppMessageConfig>;

export interface MessageGroup {
  file: string;
  messages: Record<string, string | undefined>;
}

export type AppMessageConfig = Record<LANGUAGE, MessageGroup>;

export type LANGUAGE = "english" | "french";

export const LANGUAGES: LANGUAGE[] = ["english", "french"];

export const MESSAGE_GROUPS: MessageDictionary = {
  common: {
    english: {
      file: join(
        __dirname,
        "../../../packages/common-ui/lib/intl/common-ui-en.ts"
      ),
      messages: COMMON_UI_MESSAGES_ENGLISH
    },
    french: {
      file: join(
        __dirname,
        "../../../packages/common-ui/lib/intl/common-ui-fr.ts"
      ),
      messages: COMMON_UI_MESSAGES_FR
    }
  },
  dina: {
    english: {
      file: join(__dirname, "../../../packages/dina-ui/intl/dina-ui-en.ts"),
      messages: DINAUI_MESSAGES_ENGLISH
    },
    french: {
      file: join(__dirname, "../../../packages/dina-ui/intl/dina-ui-fr.ts"),
      messages: DINAUI_MESSAGES_FRENCH
    }
  },
  seqdb: {
    english: {
      file: join(__dirname, "../../../packages/dina-ui/intl/seqdb-en.ts"),
      messages: SEQDB_MESSAGES_ENGLISH
    },
    french: {
      file: join(__dirname, "../../../packages/dina-ui/intl/seqdb-fr.ts"),
      messages: SEQDB_MESSAGES_FRENCH
    }
  }
};
