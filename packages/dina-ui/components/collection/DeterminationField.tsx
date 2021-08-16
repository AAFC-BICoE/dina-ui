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
import { clamp } from "lodash";
import { useState } from "react";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";
import { CatalogueOfLifeNameField } from ".";
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

// All fields of the Determination type.
export const DETERMINATION_FIELDS = Object.keys(DETERMINATION_FIELDS_OBJECT);

export function DeterminationField({ className }: DeterminationFieldProps) {
  const [activeTabIdx, setActiveTabIdx] = useState(0);
  const { readOnly, isTemplate } = useDinaFormContext();
  const determinationsPath = "determination";

  return (
    <FieldSet
      className={className}
      id="determination-section"
      legend={<DinaMessage id="determination" />}
    >
      <FieldArray name="determination">
        {({ form, push, remove }) => {
          const determinations =
            (form.values.determination as Determination[]) ?? [];
          function addDetermination() {
            push({});
            setActiveTabIdx(determinations.length);
          }

          function removeDetermination(index: number) {
            remove(index);
            setActiveTabIdx(current =>
              clamp(current, 0, determinations.length - 2)
            );
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
                      suggestion={vocabElement =>
                        vocabElement?.vocabularyElements?.map(
                          it => it?.name ?? ""
                        ) ?? ""
                      }
                    />
                    <TextField
                      {...fieldProps("typeStatusEvidence")}
                      multiLines={true}
                    />
                    <TextField {...fieldProps("qualifier")} multiLines={true} />
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
                {!readOnly && !isTemplate && (
                  <>
                    <hr />
                    <div className="list-inline mb-3">
                      <FormikButton
                        className="list-inline-item btn btn-primary add-assertion-button"
                        onClick={addDetermination}
                      >
                        <DinaMessage id="addAnotherDetermination" />
                      </FormikButton>
                      <FormikButton
                        className="list-inline-item btn btn-dark"
                        onClick={() => removeDetermination(index)}
                      >
                        <DinaMessage id="removeDeterminationLabel" />
                      </FormikButton>
                    </div>
                  </>
                )}
              </div>
            );
          }
          // Always shows the panel without tabs when it is a template
          return (
            <div className="determination-section">
              {readOnly ? (
                determinations.length === 1 ? (
                  determinationInternal(0)
                ) : (
                  <div className="accordion">
                    <style>{`.determination-section .accordion-button::after { background-image: none; }`}</style>
                    {determinations.map((_, index) => (
                      <div className="accordion-item" key={index}>
                        <div className="accordion-header">
                          <strong className="accordion-button collapsed text-decoration-underline">
                            <DinaMessage id="determination" /> {index + 1}
                          </strong>
                        </div>
                        <div className="accordion-body">
                          {determinationInternal(index)}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                <Tabs selectedIndex={activeTabIdx} onSelect={setActiveTabIdx}>
                  {!isTemplate && (
                    // Only show the tabs when there is more than 1 assertion:
                    <TabList
                      className={`react-tabs__tab-list ${
                        determinations.length === 1 || readOnly ? "d-none" : ""
                      }`}
                    >
                      {determinations.map((_, index) => (
                        <Tab key={index}>
                          <span className="m-3">{index + 1}</span>
                        </Tab>
                      ))}
                    </TabList>
                  )}
                  {isTemplate ? (
                    <TabPanel>{determinationInternal(0)}</TabPanel>
                  ) : determinations.length ? (
                    determinations.map((_, index) => (
                      <TabPanel key={index}>
                        {determinationInternal(index)}
                      </TabPanel>
                    ))
                  ) : null}
                </Tabs>
              )}
              {!readOnly && !isTemplate && !determinations?.length && (
                <FormikButton
                  className="list-inline-item btn btn-primary add-assertion-button"
                  onClick={addDetermination}
                >
                  <DinaMessage id="addDetermination" />
                </FormikButton>
              )}
            </div>
          );
        }}
      </FieldArray>
    </FieldSet>
  );
}
