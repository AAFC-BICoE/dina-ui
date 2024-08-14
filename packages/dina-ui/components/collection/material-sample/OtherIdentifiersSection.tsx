import { FieldSet, SelectField, TextField } from "common-ui/lib";
import useVocabularyOptions from "../useVocabularyOptions";
import { FieldArray } from "formik";
import { DinaMessage, useDinaIntl } from "packages/dina-ui/intl/dina-ui-intl";
import { FaMinus, FaPlus } from "react-icons/fa";

export function OtherIdentifiersSection() {
  const { formatMessage } = useDinaIntl();

  const { vocabOptions } = useVocabularyOptions({
    path: "collection-api/vocabulary2/materialSampleIdentifierType"
  });

  return (
    <FieldSet
      legend={<DinaMessage id={"otherIdentifiers"} />}
      id="identifierLegend"
    >
      <FieldArray name="identifiers">
        {({ form, push, remove }) => {
          const identifiers = form.values?.identifiers ?? [];

          // If empty, just display one.
          if (identifiers.length === 0) {
            push({});
          }

          function addIdentifier() {
            push({});
          }

          function removeIdentifier(index: number) {
            remove(index);
          }

          return (
            <div className={`identifier-section`}>
              {identifiers.map((_, index) => (
                <div className="row" key={index}>
                  <div className="col-md-5">
                    <SelectField
                      name={"identifiersType"}
                      options={vocabOptions as any}
                      label={formatMessage("identifierType")}
                    />
                  </div>
                  <div className="col-md-6">
                    <TextField
                      name={"identifiersValue"}
                      label={formatMessage("identifierURI")}
                    />
                  </div>
                  <div className="col-md-1">
                    <FaPlus
                      className="ms-1"
                      onClick={addIdentifier}
                      size="2em"
                      onMouseOver={(event) =>
                        (event.currentTarget.style.color = "blue")
                      }
                      onMouseOut={(event) =>
                        (event.currentTarget.style.color = "")
                      }
                      data-testid="add row button"
                    />
                    <FaMinus
                      className="ms-1"
                      onClick={() => removeIdentifier(index)}
                      size="2em"
                      onMouseOver={(event) =>
                        (event.currentTarget.style.color = "blue")
                      }
                      onMouseOut={(event) =>
                        (event.currentTarget.style.color = "")
                      }
                      data-testid="add row button"
                    />
                  </div>
                </div>
              ))}
            </div>
          );
        }}
      </FieldArray>
    </FieldSet>
  );
}
