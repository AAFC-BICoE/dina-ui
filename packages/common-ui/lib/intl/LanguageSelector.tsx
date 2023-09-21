import { useContext } from "react";
import { intlContext } from "./IntlSupport";
import Button from "react-bootstrap/Button";

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
        .filter((key) => key !== locale)
        .map((key) => {
          function onClick() {
            setLocale(key);
          }

          return (
            <Button
              variant="link"
              onClick={onClick}
              lang={key}
              key={key}
              className="px-0"
            >
              {LANGUAGE_LABELS[key]}
            </Button>
          );
        })}
    </div>
  );
}
