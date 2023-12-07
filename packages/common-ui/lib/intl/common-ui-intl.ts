import { COMMON_UI_MESSAGES_ENGLISH } from "./common-ui-en";
import { COMMON_UI_MESSAGES_FR } from "./common-ui-fr";
import { COMMON_UI_MESSAGES_DE } from "./common-ui-de";
import { getIntlSupport } from "./IntlSupport";

const en = COMMON_UI_MESSAGES_ENGLISH;
const fr = COMMON_UI_MESSAGES_FR;
const de = COMMON_UI_MESSAGES_DE;

const { FormattedMessage, IntlProvider, useIntl } = getIntlSupport({
  defaultMessages: en,
  translations: { en, fr, de }
});

export const CommonMessage = FormattedMessage;
export const CommonUIIntlProvider = IntlProvider;
