import {
  COMMON_UI_MESSAGES_ENGLISH,
  COMMON_UI_MESSAGES_FR,
  getIntlSupport
} from "common-ui";
import { DINAUI_MESSAGES_ENGLISH } from "./dina-ui-en";
import { DINAUI_MESSAGES_FRENCH } from "./dina-ui-fr";
import { SEQDB_MESSAGES_ENGLISH } from "./seqdb-en";
import { SEQDB_MESSAGES_FRENCH } from "./seqdb-fr";

const en = {
  ...COMMON_UI_MESSAGES_ENGLISH,
  ...SEQDB_MESSAGES_ENGLISH,
  ...DINAUI_MESSAGES_ENGLISH
};
const fr = {
  ...COMMON_UI_MESSAGES_FR,
  ...SEQDB_MESSAGES_FRENCH,
  ...DINAUI_MESSAGES_FRENCH
};

const { FormattedMessage, IntlProvider, useIntl } = getIntlSupport<
  // Even though Seqdb messages are included in the dina-ui messsages obejcts,
  // use DinaMessage/useDinaIntl for dina-specific messages and use SeqdbMessage/useSeqdbIntl for Seqdb-specific
  // messages to keep the intl messages organized by DINA module.
  typeof COMMON_UI_MESSAGES_ENGLISH &
    typeof DINAUI_MESSAGES_ENGLISH &
    typeof SEQDB_MESSAGES_ENGLISH
>({
  defaultMessages: en,
  translations: { en, fr }
});

export const DinaMessage = FormattedMessage;
export const DinaIntlProvider = IntlProvider;
export const useDinaIntl = useIntl;
