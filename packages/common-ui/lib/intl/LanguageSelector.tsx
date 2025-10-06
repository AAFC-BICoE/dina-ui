import _ from "lodash";
import { useContext } from "react";
import Button from "react-bootstrap/Button";
import { useInstanceContext } from "../instance/InstanceContextProvider";
import { intlContext } from "./IntlSupport";

export function LanguageSelector() {
  const { locale, setLocale } = useContext(intlContext);
  const instanceContext = useInstanceContext();

  // This component fails to server-side render because the user's locale is unknown, so only
  // render it on the client where the locale is retrieved correctly.
  if (!process.browser) {
    return null;
  }
  const supportedLanguagesArray: string[] =
    instanceContext?.supportedLanguages?.split(",")?.length &&
    instanceContext?.supportedLanguages !== ""
      ? instanceContext?.supportedLanguages?.split(",")
      : ["en"];
  return (
    <div data-testid="languageSelector">
      {supportedLanguagesArray
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
              {_.capitalize(
                new Intl.DisplayNames(key, { type: "language" }).of(key)
              )}
            </Button>
          );
        })}
    </div>
  );
}
