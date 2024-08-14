import {
  FieldSet,
  SelectField,
  TextField,
  useDinaFormContext
} from "common-ui/lib";
import useVocabularyOptions from "../useVocabularyOptions";
import { FieldArray } from "formik";
import { DinaMessage, useDinaIntl } from "packages/dina-ui/intl/dina-ui-intl";
import { FaMinus, FaPlus } from "react-icons/fa";

export function OtherIdentifiersSection() {
  const { formatMessage } = useDinaIntl();
  const { readOnly } = useDinaFormContext();

  const { vocabOptions } = useVocabularyOptions({
    path: "collection-api/vocabulary2/materialSampleType"
  });

  return (
    <FieldArray name="identifiers">
      {({ form, push, remove }) => {
        const identifiers = form.values?.identifiers ?? [];
        const selectedTypes = identifiers.map((obj) => obj.type);

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

        function containsEmptyObject() {
          return identifiers.some((obj) => Object.keys(obj).length === 0);
        }

        // Add button should be disabled if there is already an empty option being displayed or out of types to use.
        const disableAddButton =
          selectedTypes.length === vocabOptions.length || containsEmptyObject();

        function legendWrapper():
          | ((legendElement: JSX.Element) => JSX.Element)
          | undefined {
          return (legendElement) => {
            return (
              <div className="d-flex align-items-center justify-content-between">
                {legendElement}
                {!readOnly && (
                  <FaPlus
                    className="ms-auto"
                    style={{
                      cursor: disableAddButton ? "not-allowed" : "pointer",
                      color: disableAddButton ? "gray" : "black"
                    }}
                    onClick={() => {
                      if (!disableAddButton) {
                        addIdentifier();
                      }
                    }}
                    size="2em"
                    onMouseOver={(event) => {
                      if (!disableAddButton) {
                        event.currentTarget.style.color = "blue";
                      }
                    }}
                    onMouseOut={(event) => {
                      if (disableAddButton) {
                        event.currentTarget.style.color = "gray";
                      } else {
                        event.currentTarget.style.color = "black";
                      }
                    }}
                    data-testid="add row button"
                  />
                )}
              </div>
            );
          };
        }

        return (
          <FieldSet
            legend={<DinaMessage id={"otherIdentifiers"} />}
            id="identifierLegend"
            wrapLegend={legendWrapper()}
          >
            <div className={`identifier-section`}>
              {identifiers.map((_, index) => (
                <div className="row" key={index}>
                  <div className="col-md-5">
                    <SelectField
                      name={"identifiers[" + index + "].type"}
                      options={(vocabOptions as any).filter(
                        (option) => !selectedTypes.includes(option.value)
                      )}
                      label={formatMessage("identifierType")}
                    />
                  </div>
                  <div className="col-md-6">
                    <TextField
                      name={"identifiers[" + index + "].value"}
                      label={formatMessage("identifierURI")}
                    />
                  </div>
                  <div className="col-md-1">
                    <FaMinus
                      className="ms-1"
                      style={{ marginTop: "33px", cursor: "pointer" }}
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
          </FieldSet>
        );
      }}
    </FieldArray>
  );
}
