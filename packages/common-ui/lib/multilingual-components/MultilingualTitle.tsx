import React, { useEffect, useState } from "react";
import { TextField } from "../formik-connected/TextField";
import { useDinaIntl } from "../../../dina-ui/intl/dina-ui-intl";
import { useDinaFormContext } from "../formik-connected/DinaForm";
import { useApiClient } from "../api-client/ApiClientContext";

export function MultilingualTitle() {
  const { formatMessage } = useDinaIntl();
  const { initialValues } = useDinaFormContext();
  const [supportedLanguages, setSupportedLanguages] = useState<string>("en");
  const { apiClient } = useApiClient();

  useEffect(() => {
    const getSupportedLanguagesISO = async () => {
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
    getSupportedLanguagesISO();
  }, []);

  const supportedLanguagesArray: string[] = supportedLanguages?.split(",") ?? [
    "en"
  ];
  if (initialValues?.multilingualTitle) {
    Object.keys(initialValues?.multilingualTitle).forEach((isoKey) => {
      if (!supportedLanguagesArray.includes(isoKey)) {
        supportedLanguagesArray.push(isoKey);
      }
    });
  }

  return (
    <div className="row">
      {supportedLanguagesArray.map((isoKey, index) => {
        return (
          <TextField
            className={`col-md-6 ${isoKey}-title`}
            name={`multilingualTitle.${isoKey}`}
            label={formatMessage(`field_title.${isoKey}` as any)}
            key={index}
          />
        );
      })}
    </div>
  );
}
