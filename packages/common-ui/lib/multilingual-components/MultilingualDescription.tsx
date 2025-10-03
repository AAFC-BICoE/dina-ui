import { useDinaIntl } from "../../../dina-ui/intl/dina-ui-intl";
import { useDinaFormContext } from "../formik-connected/DinaForm";
import { TextField } from "../formik-connected/TextField";
import { useInstanceContext } from "../instance/InstanceContextProvider";

export function MultilingualDescription() {
  const { formatMessage } = useDinaIntl();
  const { initialValues } = useDinaFormContext();
  const instanceContext = useInstanceContext();

  const supportedLanguagesArray: string[] =
    instanceContext?.supportedLanguages?.split(",") ?? ["en"];
  if (initialValues?.multilingualDescription) {
    Object.keys(initialValues?.multilingualDescription).forEach((isoKey) => {
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
            className={`${isoKey}-description col-md-6`}
            name={`multilingualDescription.${isoKey}`}
            label={formatMessage(`field_description.${isoKey}` as any)}
            multiLines={true}
            key={index}
          />
        );
      })}
    </div>
  );
}
