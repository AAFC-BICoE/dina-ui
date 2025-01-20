import { useLocalStorage } from "@rehooks/local-storage";
import { createContext, useContext, useEffect, useMemo } from "react";
import {
  FormattedMessage as ReactFormattedMessage,
  IntlProvider as ReactIntlProvider,
  useIntl as useReactIntl
} from "react-intl";

interface MessageDictionary {
  readonly [key: string]: string;
}

interface IntlProviderProps {
  children: React.ReactNode;
}

interface IntlContextI<
  TMessages extends MessageDictionary = MessageDictionary
> {
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

export const intlContext = createContext<IntlContextI>(undefined as any);

export function getIntlSupport<TMessages extends MessageDictionary>({
  defaultMessages,
  translations = {}
}: IntlSupportParams<TMessages>) {
  function IntlProvider({ children }: IntlProviderProps) {
    const [storedLocale, setLocale] = useLocalStorage("locale");
    const locale = storedLocale ?? "en";

    useEffect(() => {
      // When the locale changes, update the html lang attribute:
      document.querySelector("html")?.setAttribute("lang", locale);
    }, [locale]);

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

  function FormattedMessage(props: FormattedMessageProps<TMessages>) {
    return <ReactFormattedMessage defaultMessage=" " {...props} />;
  }

  /**
   * The app's intl hook:
   */
  function useIntl() {
    const reactIntl = useReactIntl();

    function formatMessage(
      id: keyof TMessages & string,
      values?: { [key: string]: string | number | undefined | null }
    ) {
      return reactIntl.formatMessage({ defaultMessage: " ", id }, values);
    }

    return {
      ...(useContext(intlContext) as IntlContextI<TMessages>),
      formatMessage
    };
  }

  return { FormattedMessage, IntlProvider, useIntl };
}
