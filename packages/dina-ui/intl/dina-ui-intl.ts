import { getIntlSupport } from "common-ui";
import { DINAUI_MESSAGES_ENGLISH } from "./dina-ui-en";
import { DINAUI_MESSAGES_FRENCH } from "./dina-ui-fr";

const { FormattedMessage, IntlProvider, useIntl } = getIntlSupport({
  defaultMessages: DINAUI_MESSAGES_ENGLISH,
  translations: {
    en: DINAUI_MESSAGES_ENGLISH,
    fr: DINAUI_MESSAGES_FRENCH
  }
});

export const DinaMessage = FormattedMessage;
export const DinaIntlProvider = IntlProvider;
export const useDinaIntl = useIntl;
