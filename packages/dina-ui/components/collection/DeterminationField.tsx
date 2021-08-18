import {
  AutoSuggestTextField,
  DateField,
  FieldSet,
  FormikButton,
  TextField,
  TextFieldWithMultiplicationButton,
  useDinaFormContext
} from "common-ui";
import { FieldArray } from "formik";
import { ShouldRenderReasons } from "react-autosuggest";
import { Accordion } from "react-bootstrap";
import { VscTriangleDown, VscTriangleRight } from "react-icons/vsc";
import { CatalogueOfLifeNameField } from ".";
import { TypeStatusEnum } from "../../../dina-ui/types/collection-api/resources/TypeStatus";
import { DinaMessage } from "../../intl/dina-ui-intl";
import {
  Determination,
  MaterialSample,
  Vocabulary
} from "../../types/collection-api";

export interface DeterminationFieldProps {
  className?: string;
  namePrefix?: string;
}

/** Type-safe object with all determination fields. */
const DETERMINATION_FIELDS_OBJECT: Required<Record<keyof Determination, true>> =
  {
    verbatimScientificName: true,
    verbatimAgent: true,
    verbatimDate: true,
    typeStatus: true,
    typeStatusEvidence: true,
    determiner: true,
    determinedOn: true,
    qualifier: true,
    scientificNameSource: true,
    scientificNameDetails: true,
    scientificName: true
  };

/** All fields of the Determination type. */
export const DETERMINATION_FIELDS = Object.keys(DETERMINATION_FIELDS_OBJECT);

export function DeterminationField({ className }: DeterminationFieldProps) {
  const { readOnly, isTemplate } = useDinaFormContext();
  const determinationsPath = "determination";

  /* Ensure config is rendered when input get focuse without needing to enter any value */
  function shouldRenderSuggestions(value: string, reason: ShouldRenderReasons) {
    return (
      value?.length >= 0 ||
      reason === "input-changed" ||
      reason === "input-focused"
    );
  }

  return (
    <FieldArray name="determination">
      {({ form, push, remove }) => {
        const determinations =
          (form.values.determination as Determination[]) ?? [];
        function addDetermination() {
          push({});
          setImmediate(() => {
            // Scroll to the new accordion item:
            document
              .querySelector(".determination-section .accordion:last-child")
              ?.scrollIntoView({ behavior: "smooth", block: "center" });
          });
        }

        function removeDetermination(index: number) {
          remove(index);
        }

        function determinationInternal(index: number) {
          /** Applies name prefix to field props */
          function fieldProps(fieldName: string) {
            return {
              name: `${determinationsPath}[${index}].${fieldName}`,
              // If the first determination is enabled, then enable multiple determinations:
              templateCheckboxFieldName: `${determinationsPath}[0].${fieldName}`,
              // Don't use the prefix for the labels and tooltips:
              customName: fieldName
            };
          }

          return (
            <div>
              <div>
                <div className="row">
                  <div className="col-md-6">
                    <TextFieldWithMultiplicationButton
                      {...fieldProps("verbatimScientificName")}
                      className="col-sm-6 verbatimScientificName"
                    />
                    <AutoSuggestTextField<MaterialSample>
                      {...fieldProps("verbatimAgent")}
                      className="col-sm-6"
                      query={() => ({
                        path: "collection-api/material-sample"
                      })}
                      suggestion={sample =>
                        (sample.determination?.map(
                          det => det?.verbatimAgent
                        ) as any) ?? []
                      }
                    />
                    <DateField
                      {...fieldProps("verbatimDate")}
                      className="col-sm-6"
                    />
                    <TextField
                      {...fieldProps("transcriberRemarks")}
                      multiLines={true}
                    />
                  </div>
                  <div className="col-md-6">
                    <AutoSuggestTextField<Vocabulary>
                      {...fieldProps("typeStatus")}
                      query={() => ({
                        path: "collection-api/vocabulary/typeStatus"
                      })}
                      suggestion={(vocabElement, searchValue) =>
                        vocabElement?.vocabularyElements
                          ?.filter(it => it?.name !== TypeStatusEnum.NONE)
                          .filter(it =>
                            it?.name
                              ?.toLowerCase?.()
                              ?.includes(searchValue?.toLowerCase?.())
                          )
                          .map(it => it?.name ?? "")
                      }
                      shouldRenderSuggestions={shouldRenderSuggestions}
                    />
                    <TextField
                      {...fieldProps("typeStatusEvidence")}
                      multiLines={true}
                    />
                    <TextField {...fieldProps("qualifier")} multiLines={true} />
                  </div>
                </div>
              </div>
              <div className="row">
                <div className="col-sm-6">
                  <CatalogueOfLifeNameField
                    {...fieldProps("scientificName")}
                    scientificNameSourceField={
                      fieldProps("scientificNameSource").name
                    }
                    onChange={(newValue, formik) =>
                      formik.setFieldValue(
                        fieldProps("scientificNameSource").name,
                        newValue ? "COLPLUS" : null
                      )
                    }
                  />
                </div>
              </div>
            </div>
          );
        }

        // Always shows the panel without tabs when it is a template
        return (
          <FieldSet
            className={className}
            id="determination-section"
            legend={
              <div className="list-inline">
                <div className="d-flex gap-3 mb-2">
                  <DinaMessage id="determinations" />
                  {!readOnly && !isTemplate && determinations?.length && (
                    <FormikButton
                      className="list-inline-item btn btn-primary add-assertion-button"
                      onClick={addDetermination}
                    >
                      <DinaMessage id="addAnotherDetermination" />
                    </FormikButton>
                  )}
                </div>
              </div>
            }
          >
            <div className="determination-section">
              {determinations.length === 1 ? (
                determinationInternal(0)
              ) : (
                <div>
                  <div className="d-flex" style={{ padding: "1rem 1.25rem" }}>
                    <div className="spacer me-3" style={{ width: "16px" }} />
                    <div className="row fw-bold flex-grow-1">
                      <div className="col-3">
                        <DinaMessage id="field_verbatimScientificName" />
                      </div>
                      <div className="col-3">
                        <DinaMessage id="field_verbatimDate" />
                      </div>
                      <div className="col-3">
                        <DinaMessage id="field_verbatimAgent" />
                      </div>
                    </div>
                  </div>
                  <style>{`.accordion-button { padding: 0.5rem 1.25rem !important; }`}</style>
                  <style>{`
                    /* Zebra striping: */
                    .accordion:nth-child(even) .accordion-button { background-color: #f3f3f3 !important; }
                    .accordion:nth-child(even) .accordion-item { background-color: #f3f3f3 !important; }
                    .accordion:nth-child(odd) .accordion-button { background-color: #fff !important; }
                    .accordion:nth-child(odd) .accordion-item { background-color: #fff !important; }
 
                    /* Put the accordion arrow on the left side: */
                    .accordion-button::after { display: none !important; }
                    .accordion-button.collapsed .down-arrow { display: none !important; }
                    .accordion-button:not(.collapsed) .right-arrow { display: none !important; }
                  `}</style>
                  {isTemplate
                    ? determinationInternal(0)
                    : determinations.map((determination, index) => (
                        <Accordion
                          key={index}
                          defaultActiveKey={String(
                            readOnly ? -1 : determinations.length - 1
                          )}
                        >
                          <Accordion.Item eventKey={String(index)}>
                            <Accordion.Header className="mt-0">
                              <VscTriangleDown className="down-arrow me-3" />
                              <VscTriangleRight className="right-arrow me-3" />
                              <div className="row align-items-center flex-grow-1 fw-bold">
                                <div className="col-3 my-2">
                                  {determination.verbatimScientificName}
                                </div>
                                <div className="col-3">
                                  {determination.verbatimDate}
                                </div>
                                <div className="col-3">
                                  {determination.verbatimAgent}
                                </div>
                                <div className="col-3 d-flex">
                                  {!readOnly && !isTemplate && (
                                    <button
                                      type="button"
                                      className="btn btn-dark mx-auto"
                                      onClick={event => {
                                        event.stopPropagation();
                                        removeDetermination(index);
                                      }}
                                    >
                                      <DinaMessage id="deleteButtonText" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            </Accordion.Header>
                            <Accordion.Body>
                              {determinationInternal(index)}
                            </Accordion.Body>
                          </Accordion.Item>
                        </Accordion>
                      ))}
                </div>
              )}
            </div>
          </FieldSet>
        );
      }}
    </FieldArray>
  );
}
