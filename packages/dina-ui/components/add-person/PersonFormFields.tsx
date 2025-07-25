import { FieldSet, FormikButton, useDinaFormContext } from "common-ui";
import { Person } from "../../../dina-ui/types/objectstore-api";
import React, { useState } from "react";
import { FieldArray } from "formik";
import _ from "lodash";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";

import { DinaMessage } from "../../../dina-ui/intl/dina-ui-intl";
import { IdentifierRow } from "../identifier/IdentifierRow";

export interface PersonFormFieldsProps {
  divClassName?: string;
  fieldClassName?: string;
  width?: string;
}

export function PersonFormFields({
  width,
  divClassName,
  fieldClassName
}: PersonFormFieldsProps) {
  const [activeTabIdx, setActiveTabIdx] = useState(0);
  const { readOnly } = useDinaFormContext();

  return (
    <div className={divClassName} style={{ width: `${width}` }}>
      <div className={`${fieldClassName}`}>
        <FieldSet
          legend={<DinaMessage id="identifierLegend" />}
          id="identifierLegend"
        >
          <FieldArray name="identifiers">
            {({ form, push, remove }) => {
              const identifiers = (form.values as Person)?.identifiers ?? [];

              function addIdentifier() {
                push({});
                setActiveTabIdx(identifiers.length);
              }

              function removeIdentifier(index: number) {
                remove(index);
                // Stay on the current tab number, or reduce if removeing the last element:
                setActiveTabIdx((current) =>
                  _.clamp(current, 0, identifiers.length - 2)
                );
              }
              return (
                <div className={`identifier-section `}>
                  <Tabs selectedIndex={activeTabIdx} onSelect={setActiveTabIdx}>
                    {
                      // Only show the tabs when there is more than 1 identifier:
                      <TabList
                        className={`react-tabs__tab-list ${
                          identifiers.length === 1 ? "d-none" : ""
                        }`}
                      >
                        {identifiers.map((_, index) => (
                          <Tab key={index}>
                            <span className="m-3">{index + 1}</span>
                          </Tab>
                        ))}
                      </TabList>
                    }
                    {identifiers.map((_, index) => (
                      <TabPanel key={index}>
                        <IdentifierRow
                          index={index}
                          vocabularyOptionsEndpoint="agent-api/vocabulary/identifiers"
                        />
                        {!readOnly && (
                          <div className="list-inline mb-3">
                            <FormikButton
                              className="list-inline-item btn btn-primary add-identifier-button"
                              onClick={addIdentifier}
                            >
                              <DinaMessage id="addAnotherIdentifier" />
                            </FormikButton>
                            <FormikButton
                              className="list-inline-item btn btn-dark"
                              onClick={() => removeIdentifier(index)}
                            >
                              <DinaMessage id="removeIdentifier" />
                            </FormikButton>
                          </div>
                        )}
                      </TabPanel>
                    ))}
                  </Tabs>
                  {!readOnly && identifiers.length === 0 && (
                    <FormikButton
                      className="btn btn-primary add-identifier-button mb-2"
                      onClick={addIdentifier}
                    >
                      <DinaMessage id="addIdentifier" />
                    </FormikButton>
                  )}
                </div>
              );
            }}
          </FieldArray>
        </FieldSet>
      </div>
    </div>
  );
}
