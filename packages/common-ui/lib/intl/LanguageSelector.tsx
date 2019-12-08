import { Fragment } from "react";

export interface LanguageSelectorProps {
  locale: string;
  onLocaleChange: (newLocale: string) => void;
}

const LANGUAGE_LABELS = {
  en: "English",
  fr: "Français"
};

export function LanguageSelector({
  locale,
  onLocaleChange
}: LanguageSelectorProps) {
  // This component fails to server-side render because the user's locale is unknown, so only
  // render it on the client where the locale is retrieved correctly.
  if (!process.browser) {
    return null;
  }

  return (
    <>
      {Object.keys(LANGUAGE_LABELS).map((key, i, arr) => {
        const divider = i < arr.length - 1 && " | ";

        function onClick() {
          onLocaleChange(key);
        }

        return (
          <Fragment key={key}>
            <button
              className="btn btn-link"
              disabled={locale === key}
              onClick={onClick}
            >
              {LANGUAGE_LABELS[key]}
            </button>
            <div style={{ paddingTop: "0.375rem" }}>{divider}</div>
          </Fragment>
        );
      })}
    </>
  );
}
