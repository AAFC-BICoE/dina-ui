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
import { DinaMessage } from "../../intl/dina-ui-intl";
import { Determination, MaterialSample } from "../../types/collection-api";

export interface DeterminationFieldProps {
  className?: string;
  namePrefix?: string;
}

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
    scientificName: true
  };

// All fields of the Determination type.
export const DETERMINATION_FIELDS = Object.keys(DETERMINATION_FIELDS_OBJECT);

export function DeterminationField({
  className,
  namePrefix = ""
}: DeterminationFieldProps) {
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

          const determinationInternal = (index, commonRoot) => (
            <TabPanel key={index}>
              <div className="row">
                <div className="col-md-6">
                  <TextFieldWithMultiplicationButton
                    name={`${namePrefix}${commonRoot}verbatimScientificName`}
                    customName="verbatimScientificName"
                    className="col-sm-6 verbatimScientificName"
                  />
                  <AutoSuggestTextField<MaterialSample>
                    name={`${namePrefix}${commonRoot}verbatimAgent`}
                    customName="verbatimAgent"
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
                    name={`${namePrefix}${commonRoot}verbatimDate`}
                    customName="verbatimDate"
                    className="col-sm-6"
                  />
                  <TextField
                    name={`${namePrefix}${commonRoot}verbatimRemarks`}
                    customName="vebatimRemarks"
                    multiLines={true}
                  />
                </div>
                <div className="col-md-6">
                  <TextField
                    name={`${namePrefix}${commonRoot}typeStatus`}
                    customName="typeStatus"
                    multiLines={true}
                  />
                  <TextField
                    name={`${namePrefix}${commonRoot}typeStatusEvidence`}
                    customName="typeStatusEvidence"
                    multiLines={true}
                  />
                  <TextField
                    name={`${namePrefix}${commonRoot}qualifier`}
                    customName="qualifier"
                    multiLines={true}
                  />
                </div>
                {!readOnly && !isTemplate && (
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
                )}
              </div>
            </TabPanel>
          );
          // Always shows the panel without tabs when it is a template
          return (
            <div className="determination-section">
              <Tabs selectedIndex={activeTabIdx} onSelect={setActiveTabIdx}>
                {isTemplate ? null : (
                  // Only show the tabs when there is more than 1 assertion:
                  <TabList
                    className={`react-tabs__tab-list ${
                      determinations.length === 1 ? "d-none" : ""
                    }`}
                  >
                    {determinations.map((_, index) => (
                      <Tab key={index}>
                        <span className="m-3">{index + 1}</span>
                      </Tab>
                    ))}
                  </TabList>
                )}
                {isTemplate
                  ? determinationInternal(0, `${determinationsPath}[${0}].`)
                  : determinations.length
                  ? determinations.map((_, index) => {
                      const determinationPath = `${determinationsPath}[${index}]`;
                      const commonRoot = determinationPath + ".";
                      return determinationInternal(index, commonRoot);
                    })
                  : null}
              </Tabs>
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
