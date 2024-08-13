import {
  FieldSet,
  FormikButton,
  useDinaFormContext,
  SelectOption
} from "common-ui";
import React, { useState } from "react";
import { FieldArray } from "formik";
import { clamp } from "lodash";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";
import { DinaMessage } from "../../../dina-ui/intl/dina-ui-intl";
import { IdentifierRow } from "./IdentifierRow";

export interface IdentifierFieldsProps {
  typeOptions?: SelectOption<string | undefined>[];
  divClassName?: string;
  fieldClassName?: string;
  width?: string;
  legendId?: string;
  otherIdentifiersMode?: boolean;
}

export function IdentifierFields({
  typeOptions,
  width,
  divClassName,
  fieldClassName,
  legendId = "identifierLegend",
  otherIdentifiersMode = false
}: IdentifierFieldsProps) {
  const [activeTabIdx, setActiveTabIdx] = useState(0);
  const { readOnly, isBulkEditAllTab } = useDinaFormContext();

  // Disable temporarly for bulk editing since it's not working correctly.
  if (otherIdentifiersMode && isBulkEditAllTab) {
    return <></>;
  }

  return (
    <div className={divClassName} style={{ width: `${width}` }}>
      <div className={`${fieldClassName}`}>
        <FieldSet
          legend={<DinaMessage id={legendId as any} />}
          id="identifierLegend"
        >
          <FieldArray name="identifiers">
            {({ form, push, remove }) => {
              const identifiers = otherIdentifiersMode
                ? Object.keys(form.values?.identifiers ?? {})
                : form.values?.identifiers ?? [];

              function addIdentifier() {
                if (otherIdentifiersMode && identifiers.length === 1) {
                  return;
                }

                push({});
                setActiveTabIdx(identifiers.length);
              }

              function removeIdentifier(index: number) {
                remove(index);
                // Stay on the current tab number, or reduce if removeing the last element:
                setActiveTabIdx((current) =>
                  clamp(current, 0, identifiers.length - 2)
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
                          typeOptions={typeOptions}
                        />
                        {!readOnly && (
                          <div className="list-inline mb-3">
                            {otherIdentifiersMode &&
                              identifiers.length !== 1 && (
                                <FormikButton
                                  className="list-inline-item btn btn-primary add-identifier-button"
                                  onClick={addIdentifier}
                                >
                                  <DinaMessage id="addAnotherIdentifier" />
                                </FormikButton>
                              )}
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
