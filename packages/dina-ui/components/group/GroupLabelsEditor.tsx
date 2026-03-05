import _ from "lodash";
import { useState } from "react";
import { RiDeleteBinLine } from "react-icons/ri";
import Select from "react-select";
import {
  FieldSet,
  FieldSpy,
  FieldWrapper,
  FormikButton,
  useInstanceContext
} from "../../../common-ui/lib";
import { DinaMessage } from "../../../dina-ui/intl/dina-ui-intl";

export interface GroupLabelsEditorProps {
  valuesPath: string;
}

interface GroupLabelsEditorInnerProps extends GroupLabelsEditorProps {
  currentValue?: Record<string, string | null | undefined> | null | undefined;
  form: any;
}

type Option = {
  label: string;
  value?: string;
};

// This component is used in the GroupForm to edit the labels of a group in different languages. It uses the supportedLanguages from the instance context to determine which languages are available to add, and allows the user to add or remove languages and their corresponding labels.
function GroupLabelsEditorInner({
  valuesPath,
  currentValue,
  form
}: GroupLabelsEditorInnerProps) {
  const instanceContext = useInstanceContext();
  const [languageToAdd] = useState<Option | null>(null);
  const supportedLanguagesArray: string[] =
    instanceContext?.supportedLanguages?.split(",")?.length &&
    instanceContext?.supportedLanguages !== ""
      ? instanceContext?.supportedLanguages?.split(",")
      : ["en"];

  const [visibleLanguages, setVisibleLanguages] = useState(
    _.keys(currentValue)
  );
  const [availableLanguages, setAvailableLanguages] = useState(
    _.difference(supportedLanguagesArray, visibleLanguages)
  );

  const languageOptions = availableLanguages.map(
    (lang) =>
      ({
        label: lang,
        value: lang
      } as Option)
  );

  return (
    <FieldSet
      className="my-3"
      legend={<DinaMessage id="field_groupLabels" />}
      id="groupLabels"
    >
      <div className="mb-3">
        <div className="row">
          {visibleLanguages.map((language) => (
            <div key={language}>
              <label className="col-sm-3 me-3 d-flex">
                <strong className="me-auto mt-3">{language}</strong>
                <FieldWrapper
                  name={`${valuesPath}.${language}`}
                  hideLabel={true}
                  className=""
                >
                  {({ setValue, value }) => {
                    return (
                      <input
                        className="form-control"
                        onChange={(event) => setValue(event.target.value)}
                        value={value || ""}
                      />
                    );
                  }}
                </FieldWrapper>
                <FormikButton
                  className="btn remove-attribute"
                  onClick={(_, form) => {
                    // Delete the value and hide the label:
                    form.setFieldValue(`${valuesPath}.${language}`, undefined);
                    // Add the language back to availableLanguages
                    setAvailableLanguages(
                      _.concat(availableLanguages, language).sort()
                    );
                    // Remove the language from visibleLanguages
                    setVisibleLanguages((languages) =>
                      languages.filter((lang) => lang !== language)
                    );
                  }}
                >
                  <RiDeleteBinLine size="1.8em" />
                </FormikButton>
              </label>
            </div>
          ))}
        </div>
        <div className="row">
          <Select<Option>
            options={languageOptions}
            value={languageToAdd}
            onChange={(value) => {
              const selectedLang = value?.value;
              if (selectedLang) {
                // add the language to visibleLanguages
                setVisibleLanguages(_.concat(visibleLanguages, selectedLang));
                // remove the language from availableLanguages
                setAvailableLanguages((languages) =>
                  languages.filter((lang) => lang !== selectedLang)
                );
                // set fieldValue in the formik.
                form.setFieldValue(`${valuesPath}.${selectedLang}`, "");
              }
            }}
          />
        </div>
      </div>
    </FieldSet>
  );
}

// FieldSpy wrapper for GroupLabelsEditorInner to get the current value of the labels and the formik form object to manipulate the form state when adding or removing languages.
export function GroupLabelsEditor({ valuesPath }: GroupLabelsEditorProps) {
  return (
    <FieldSpy<Record<string, string | null | undefined>> fieldName={valuesPath}>
      {(currentValue, { form }) => {
        return (
          <GroupLabelsEditorInner
            valuesPath={valuesPath}
            currentValue={currentValue}
            form={form}
          />
        );
      }}
    </FieldSpy>
  );
}
