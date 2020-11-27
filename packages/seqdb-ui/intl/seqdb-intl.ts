import {
  COMMON_UI_MESSAGES_ENGLISH,
  COMMON_UI_MESSAGES_FR,
  getIntlSupport
} from "common-ui";
import { SEQDB_MESSAGES_ENGLISH } from "./seqdb-en";
import { SEQDB_MESSAGES_FRENCH } from "./seqdb-fr";

const en = { ...COMMON_UI_MESSAGES_ENGLISH, ...SEQDB_MESSAGES_ENGLISH };
const fr = { ...COMMON_UI_MESSAGES_FR, ...SEQDB_MESSAGES_FRENCH };

const { FormattedMessage, IntlProvider, useIntl } = getIntlSupport({
  defaultMessages: en,
  translations: { en, fr }
});

export const SeqdbMessage = FormattedMessage;
export const SeqdbIntlProvider = IntlProvider;
export const useSeqdbIntl = useIntl;
