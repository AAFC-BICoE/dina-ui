import { Fragment, useContext } from "react";
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
      {Object.keys(LANGUAGE_LABELS).map((key, i, arr) => {
        const divider = i < arr.length - 1 && " | ";

        function onClick() {
          setLocale(key);
        }

        return (
          <div key={key} className="d-inline">
            <button
              className="btn btn-link px-0"
              disabled={locale === key}
              onClick={onClick}
            >
              {LANGUAGE_LABELS[key]}
            </button>
            <div className="d-inline" style={{ paddingTop: "0.375rem" }}>
              {divider}
            </div>
          </div>
        );
      })}
    </div>
  );
}
