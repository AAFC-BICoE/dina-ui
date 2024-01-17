import { useContext, useEffect, useState } from "react";
import { intlContext } from "./IntlSupport";
import Button from "react-bootstrap/Button";
import { useApiClient } from "../api-client/ApiClientContext";
import { capitalize } from "lodash";

export function LanguageSelector() {
  const { locale, setLocale } = useContext(intlContext);
  const [supportedLanguages, setSupportedLanguages] = useState<string>("en");
  const { apiClient } = useApiClient();

  useEffect(() => {
    const getInstanceMode = async () => {
      try {
        const response = await apiClient.axios.get(`/instance.json`);
        if (response.data["supported-languages-iso"]) {
          setSupportedLanguages(response.data["supported-languages-iso"]);
        } else {
          setSupportedLanguages("en");
        }
      } catch (error) {
        console.error(error);
      }
    };
    getInstanceMode();
  }, []);

  // This component fails to server-side render because the user's locale is unknown, so only
  // render it on the client where the locale is retrieved correctly.
  if (!process.browser) {
    return null;
  }

  const supportedLanguagesArray: string[] = supportedLanguages?.split(",") ?? [
    "en"
  ];

  return (
    <div>
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
              {capitalize(
                new Intl.DisplayNames(key, { type: "language" }).of(key)
              )}
            </Button>
          );
        })}
    </div>
  );
}
