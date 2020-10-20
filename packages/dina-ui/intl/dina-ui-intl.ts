import {
  COMMON_UI_MESSAGES_ENGLISH,
  COMMON_UI_MESSAGES_FR,
  getIntlSupport
} from "common-ui";
import { DINAUI_MESSAGES_ENGLISH } from "./dina-ui-en";
import { DINAUI_MESSAGES_FRENCH } from "./dina-ui-fr";

const en = { ...COMMON_UI_MESSAGES_ENGLISH, ...DINAUI_MESSAGES_ENGLISH };
const fr = { ...COMMON_UI_MESSAGES_FR, ...DINAUI_MESSAGES_FRENCH };

const { FormattedMessage, IntlProvider, useIntl } = getIntlSupport({
  defaultMessages: en,
  translations: { en, fr }
});

export const DinaMessage = FormattedMessage;
export const DinaIntlProvider = IntlProvider;
export const useDinaIntl = useIntl;
