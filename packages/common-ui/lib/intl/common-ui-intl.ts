import { COMMON_UI_MESSAGES_ENGLISH } from "./common-ui-en";
import { COMMON_UI_MESSAGES_FR } from "./common-ui-fr";
import { getIntlSupport } from "./IntlSupport";

const { FormattedMessage, IntlProvider, useIntl } = getIntlSupport({
  defaultMessages: COMMON_UI_MESSAGES_ENGLISH,
  translations: {
    en: COMMON_UI_MESSAGES_ENGLISH,
    fr: COMMON_UI_MESSAGES_FR
  }
});

export const CommonMessage = FormattedMessage;
export const CommonUIIntlProvider = IntlProvider;
