import {
  COMMON_UI_MESSAGES_ENGLISH,
  COMMON_UI_MESSAGES_FR,
  COMMON_UI_MESSAGES_DE,
  getIntlSupport
} from "common-ui";
import { SEQDB_MESSAGES_ENGLISH } from "./seqdb-en";
import { SEQDB_MESSAGES_FRENCH } from "./seqdb-fr";
import { SEQDB_MESSAGES_GERMAN } from "./seqdb-de";

const en = { ...COMMON_UI_MESSAGES_ENGLISH, ...SEQDB_MESSAGES_ENGLISH };
const fr = { ...COMMON_UI_MESSAGES_FR, ...SEQDB_MESSAGES_FRENCH };
const de = { ...COMMON_UI_MESSAGES_DE, ...SEQDB_MESSAGES_GERMAN };

const { FormattedMessage, IntlProvider, useIntl } = getIntlSupport({
  defaultMessages: en,
  translations: { en, fr, de }
});

export const SeqdbMessage = FormattedMessage;
export const SeqdbIntlProvider = IntlProvider;
export const useSeqdbIntl = useIntl;
