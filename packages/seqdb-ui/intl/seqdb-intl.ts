import { getIntlSupport } from "common-ui";
import { SEQDB_MESSAGES_ENGLISH } from "./seqdb-en";
import { SEQDB_MESSAGES_FRENCH } from "./seqdb-fr";

const { FormattedMessage, IntlProvider } = getIntlSupport({
  defaultMessages: SEQDB_MESSAGES_ENGLISH,
  translations: {
    en: SEQDB_MESSAGES_ENGLISH,
    fr: SEQDB_MESSAGES_FRENCH
  }
});

export const SeqdbMessage = FormattedMessage;
export const SeqdbIntlProvider = IntlProvider;
