import {
  FieldSet,
  SelectField,
  SelectOption,
  TextField,
  useDinaFormContext
} from "common-ui/lib";
import useVocabularyOptions from "../useVocabularyOptions";
import { FieldArray } from "formik";
import { DinaMessage } from "../../../intl/dina-ui-intl";
import { FaMinus, FaPlus } from "react-icons/fa";

export function OtherIdentifiersSection() {
  const { readOnly } = useDinaFormContext();

  const { vocabOptions: vocab } = useVocabularyOptions({
    path: "collection-api/vocabulary2/materialSampleIdentifierType"
  });

  const vocabOptions: SelectOption<string>[] = vocab.map((v) => ({
    label: v.label,
    value: v.value
  }));

  return (
    <FieldSet
      legend={<DinaMessage id={"otherIdentifiers"} />}
      wrapLegend={() => <></>}
      id="identifierLegend"
    >
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
            selectedTypes.length === vocabOptions.length ||
            containsEmptyObject();

          return (
            <div className={`identifier-section`}>
              {/* Top header, where the plus icon is displayed */}
              <div className="row">
                <div className="col-md-8">
                  <h2 className="fieldset-h2-adjustment">
                    <DinaMessage id="otherIdentifiers" />
                  </h2>
                </div>
                <div className="col-md-4 d-flex align-items-center justify-content-between">
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
              </div>

              {/* Each of other identifier rows to be displayed */}
              {identifiers.map((_, index) => (
                <div className="row" key={index}>
                  <div className={readOnly ? "col-md-2" : "col-md-5"}>
                    <SelectField<string>
                      name={"identifiers[" + index + "].type"}
                      options={vocabOptions.filter(
                        (option) => !selectedTypes.includes(option.value)
                      )}
                      readOnlyRender={(optionValue) => (
                        <strong>
                          {vocabOptions.find(
                            (item) => item.value === optionValue
                          )?.label ?? ""}
                          :
                        </strong>
                      )}
                      hideLabel={true}
                    />
                  </div>
                  <div className="col-md-6">
                    <TextField
                      name={"identifiers[" + index + "].value"}
                      hideLabel={true}
                    />
                  </div>
                  <div className="col-md-1 d-flex align-items-center justify-content-between">
                    {!readOnly && (
                      <FaMinus
                        className="ms-auto"
                        style={{ marginTop: "-10px", cursor: "pointer" }}
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
                    )}
                  </div>
                </div>
              ))}
            </div>
          );
        }}
      </FieldArray>

      <FieldArray name="dwcOtherCatalogNumbers">
        {({ form, push, remove }) => {
          const otherCatalogNumbers = form.values?.dwcOtherCatalogNumbers ?? [];

          // If empty, just display one.
          if (otherCatalogNumbers.length === 0) {
            push("");
          }

          function addCatalogNumber() {
            push("");
          }

          function removeCatalogNumber(index: number) {
            remove(index);
          }

          function containsEmptyObject() {
            return (
              otherCatalogNumbers.some(
                (obj) => Object.keys(obj).length === 0
              ) || otherCatalogNumbers.find((obj) => obj.value === "")
            );
          }

          const disableAddButton = containsEmptyObject();

          return (
            <div className="other-catalogue-numbers-section">
              {/* Top header, where the plus icon is displayed */}
              <div
                className="row"
                style={{ borderTop: "1px solid lightgray", paddingTop: "15px" }}
              >
                <div className="col-md-8">
                  <strong>
                    <DinaMessage id={"field_dwcOtherCatalogNumbers"} />
                  </strong>
                </div>
                <div className="col-md-4 d-flex align-items-center justify-content-between">
                  {!readOnly && (
                    <FaPlus
                      className="ms-auto"
                      style={{
                        cursor: disableAddButton ? "not-allowed" : "pointer",
                        color: disableAddButton ? "gray" : "black"
                      }}
                      onClick={() => {
                        if (!disableAddButton) {
                          addCatalogNumber();
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
              </div>

              {/* Each of other catalog numbers rows to be displayed */}
              {!readOnly &&
                otherCatalogNumbers.map((_, index) => (
                  <div className="row" key={index}>
                    <div className="col-md-11">
                      <TextField
                        name={"dwcOtherCatalogNumbers[" + index + "]"}
                        hideLabel={true}
                      />
                    </div>
                    <div className="col-md-1 d-flex align-items-center justify-content-between">
                      {!readOnly && (
                        <FaMinus
                          className="ms-auto"
                          style={{ marginTop: "-10px", cursor: "pointer" }}
                          onClick={() => removeCatalogNumber(index)}
                          size="2em"
                          onMouseOver={(event) =>
                            (event.currentTarget.style.color = "blue")
                          }
                          onMouseOut={(event) =>
                            (event.currentTarget.style.color = "")
                          }
                          data-testid="add row button"
                        />
                      )}
                    </div>
                  </div>
                ))}

              {/* Read-only mode, display it like an array. */}
              {readOnly && (
                <p className="mt-2">{otherCatalogNumbers.join(", ")}</p>
              )}
            </div>
          );
        }}
      </FieldArray>
    </FieldSet>
  );
}
