import { getIntlSupport } from "common-ui";
import { OBJECTSTORE_MESSAGES_ENGLISH } from "./objectstore-en";
import { OBJECTSTORE_MESSAGES_FRENCH } from "./objectstore-fr";

const { FormattedMessage, IntlProvider } = getIntlSupport({
  defaultMessages: OBJECTSTORE_MESSAGES_ENGLISH,
  translations: {
    en: OBJECTSTORE_MESSAGES_ENGLISH,
    fr: OBJECTSTORE_MESSAGES_FRENCH
  }
});

export const ObjectStoreMessage = FormattedMessage;
export const ObjectStoreIntlProvider = IntlProvider;
