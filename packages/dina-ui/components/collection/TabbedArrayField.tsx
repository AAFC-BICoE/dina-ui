import {
  FieldSet,
  FieldWrapperProps,
  FormikButton,
  useDinaFormContext
} from "common-ui";
import { FieldArray } from "formik";
import { clamp } from "lodash";
import { ReactNode, useState } from "react";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";
import { DinaMessage } from "../../intl/dina-ui-intl";

export interface TabbedArrayFieldProps<T> {
  sectionId: string;
  initialIndex?: number;
  name: string;
  legend: JSX.Element;
  makeNewElement: (elements: T[]) => T;
  renderTabPanel: (panelCtx: TabPanelCtx) => ReactNode;
  renderTab: (element: T, index: number) => ReactNode;
}

export interface TabPanelCtx {
  /** Prefixed field name props for nesting inside an array field. */
  fieldProps: (fieldName: string) => FieldWrapperProps;
  /** Array element index. */
  index: number;
}

export function TabbedArrayField<T>({
  name,
  makeNewElement,
  sectionId,
  initialIndex = 0,
  legend,
  renderTabPanel,
  renderTab
}: TabbedArrayFieldProps<T>) {
  const { readOnly, isTemplate } = useDinaFormContext();

  const [activeTabIdx, setActiveTabIdx] = useState(initialIndex);

  return (
    <div>
      <FieldArray name={name}>
        {fieldArrayProps => {
          const elements = (fieldArrayProps.form.getFieldMeta(name).value ||
            []) as T[];

          function addElement() {
            fieldArrayProps.push(makeNewElement(elements));
            setActiveTabIdx(elements.length);
          }

          function removeElement(index: number) {
            fieldArrayProps.remove(index); // Stay on the current tab number, or reduce if removeing the last element:
            setActiveTabIdx(current => clamp(current, 0, elements.length - 2));
          }

          function elementInternal(index: number) {
            /** Applies name prefix to field props */
            function fieldProps(fieldName: string) {
              return {
                name: `${name}[${index}].${fieldName}`,
                // If the first element is enabled, then enable multiple elements:
                templateCheckboxFieldName: `${name}[0].${fieldName}`,
                // Don't use the prefix for the labels and tooltips:
                customName: fieldName
              };
            }

            return renderTabPanel({ fieldProps, index });
          }

          // Always shows the panel without tabs when it is a template
          return (
            <FieldSet className={sectionId} id={sectionId} legend={legend}>
              <Tabs selectedIndex={activeTabIdx} onSelect={setActiveTabIdx}>
                {
                  // Only show the tabs when there is more than 1 assertion:
                  <TabList
                    className={`react-tabs__tab-list mb-0 ${
                      elements.length === 1 ? "d-none" : ""
                    }`}
                  >
                    {elements.map((element, index) => (
                      <Tab key={index}>{renderTab(element, index)}</Tab>
                    ))}
                  </TabList>
                }
                {elements.length
                  ? elements.map((_, index) => (
                      <TabPanel key={index}>
                        <div
                          className="card-body border-top-0 mb-3"
                          style={
                            elements.length > 1
                              ? { border: "1px solid rgb(170, 170, 170)" }
                              : undefined
                          }
                        >
                          {elementInternal(index)}
                          {!readOnly && !isTemplate && (
                            <div className="list-inline">
                              <FormikButton
                                className="list-inline-item btn btn-primary add-button"
                                onClick={addElement}
                              >
                                <DinaMessage id="add" />
                              </FormikButton>
                              <FormikButton
                                className="list-inline-item btn btn-dark"
                                onClick={() => removeElement(index)}
                              >
                                <DinaMessage id="remove" />
                              </FormikButton>
                            </div>
                          )}
                        </div>
                      </TabPanel>
                    ))
                  : null}
              </Tabs>
              {!elements.length && !readOnly && !isTemplate && (
                <FormikButton
                  className="btn btn-primary add-button"
                  onClick={addElement}
                >
                  <DinaMessage id="add" />
                </FormikButton>
              )}
            </FieldSet>
          );
        }}
      </FieldArray>
    </div>
  );
}
