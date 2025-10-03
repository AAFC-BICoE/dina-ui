import { useDinaIntl } from "../../../dina-ui/intl/dina-ui-intl";
import { useDinaFormContext } from "../formik-connected/DinaForm";
import { TextField } from "../formik-connected/TextField";
import { useInstanceContext } from "../instance/InstanceContextProvider";

export function MultilingualTitle() {
  const { formatMessage } = useDinaIntl();
  const { initialValues } = useDinaFormContext();
  const instanceContext = useInstanceContext();

  const supportedLanguagesArray: string[] =
    instanceContext?.supportedLanguages?.split(",") ?? ["en"];
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
