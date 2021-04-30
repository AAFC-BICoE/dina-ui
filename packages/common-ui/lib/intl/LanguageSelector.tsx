import { useContext } from "react";
import { intlContext } from "./IntlSupport";

const LANGUAGE_LABELS = {
  en: "English",
  fr: "Français"
};

export function LanguageSelector() {
  const { locale, setLocale } = useContext(intlContext);

  // This component fails to server-side render because the user's locale is unknown, so only
  // render it on the client where the locale is retrieved correctly.
  if (!process.browser) {
    return null;
  }

  return (
    <div>
      {Object.keys(LANGUAGE_LABELS)
        .filter(key => key !== locale)
        .map(key => {
          function onClick() {
            setLocale(key);
          }

          return (
            <div key={locale} className="d-inline">
              <button
                className="btn btn-link px-0"
                style={{ color: "#00C" }}
                onClick={onClick}
                lang={locale}
              >
                {LANGUAGE_LABELS[key]}
              </button>
            </div>
          );
        })}
    </div>
  );
}
