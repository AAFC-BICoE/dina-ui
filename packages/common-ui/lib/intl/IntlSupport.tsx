import { createContext, useContext, useMemo } from "react";
import { useCookies } from "react-cookie";
import {
  FormattedMessage as ReactFormattedMessage,
  IntlProvider as ReactIntlProvider
} from "react-intl";

interface MessageDictionary {
  readonly [key: string]: string;
}

interface IntlProviderProps {
  children: React.ReactNode;
}

interface IntlContextI<TMessages extends MessageDictionary> {
  locale: string;
  setLocale: (newLocale: string) => void;
  messages: TMessages;
}

interface FormattedMessageProps<TMessages extends MessageDictionary> {
  id: keyof TMessages & string;
  values?: { [key: string]: React.ReactNode };
}

interface IntlSupportParams<TMessages extends MessageDictionary> {
  defaultMessages: TMessages;
  translations?: { [key: string]: Partial<TMessages> };
}

export function getIntlSupport<TMessages extends MessageDictionary>({
  defaultMessages,
  translations = {}
}: IntlSupportParams<TMessages>) {
  const intlContext = createContext<IntlContextI<TMessages>>(undefined as any);

  function IntlProvider({ children }: IntlProviderProps) {
    const [{ locale = "en" }, setCookie] = useCookies(["locale"]);

    function setLocale(newLocale: string) {
      // Set this cookie domain-wide:
      setCookie("locale", newLocale, { path: "/" });
    }

    const messages = useMemo(
      () =>
        process.browser
          ? // Show the translated message if it exists, otherwise show the default English message:
            {
              ...defaultMessages,
              ...(translations[locale] || {})
            }
          : // Only display messages when rendering in the browser.
            // This prevents the English messages from briefly displaying in the initial server-rendered page:
            ({} as TMessages),
      [defaultMessages, translations, locale]
    );

    return (
      <intlContext.Provider value={{ locale, setLocale, messages }}>
        <ReactIntlProvider locale={locale} messages={messages}>
          {children}
        </ReactIntlProvider>
      </intlContext.Provider>
    );
  }

  function useIntl() {
    return useContext(intlContext);
  }

  function FormattedMessage(props: FormattedMessageProps<TMessages>) {
    return <ReactFormattedMessage defaultMessage=" " {...props} />;
  }

  return { FormattedMessage, IntlProvider, useIntl };
}
