import { useContext, useEffect, useState } from "react";
import { intlContext } from "./IntlSupport";
import Button from "react-bootstrap/Button";
import { useApiClient } from "../api-client/ApiClientContext";

const LANGUAGE_LABELS = {
  en: "English",
  fr: "Français"
};

export function LanguageSelector() {
  const { locale, setLocale } = useContext(intlContext);
  const [supportedLanguages, setSupportedLanguages] = useState<string>();
  const { apiClient } = useApiClient();

  useEffect(() => {
    const getInstanceMode = async () => {
      try {
        const response = await apiClient.axios.get(`/instance.json`);
        setSupportedLanguages(response.data["supported-languages-iso"]);
      } catch (error) {
        setSupportedLanguages(undefined);
      }
    };
    getInstanceMode();
  }, []);

  // This component fails to server-side render because the user's locale is unknown, so only
  // render it on the client where the locale is retrieved correctly.
  if (!process.browser) {
    return null;
  }

  return (
    <div>
      {supportedLanguages
        ?.split(",")
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
