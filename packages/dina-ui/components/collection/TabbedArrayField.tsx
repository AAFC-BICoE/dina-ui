import classNames from "classnames";
import {
  FieldSet,
  FieldWrapperProps,
  FormikButton,
  useDinaFormContext
} from "common-ui";
import { FieldArray, useFormikContext } from "formik";
import { clamp, get, isEmpty } from "lodash";
import { ReactNode, useState, useEffect } from "react";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";
import { DinaMessage } from "../../intl/dina-ui-intl";

export interface TabbedArrayFieldProps<T> {
  className?: string;
  sectionId: string;
  typeName: string;
  initialIndex?: number;
  name: string;
  legend: JSX.Element;
  onChangeTabIndex?: (newIndex: number) => void;
  makeNewElement: (elements: T[]) => T;
  renderTabPanel: (panelCtx: TabPanelCtx<T>) => ReactNode;
  renderTab: (element: T, index: number) => ReactNode;
  renderAboveTabs?: () => ReactNode;
}

export interface TabPanelCtx<T> {
  /** Prefixed field name props for nesting inside an array field. */
  fieldProps: (fieldName: string) => FieldWrapperProps;
  /** Array element index. */
  index: number;

  elements: T[];
}

export function TabbedArrayField<T>({
  className,
  name,
  typeName,
  makeNewElement,
  sectionId,
  initialIndex = 0,
  legend,
  onChangeTabIndex,
  renderTabPanel,
  renderTab,
  renderAboveTabs
}: TabbedArrayFieldProps<T>) {
  const { readOnly, isTemplate } = useDinaFormContext();

  const [activeTabIdx, setActiveTabIdx] = useState(initialIndex);

  useEffect(() => {
    onChangeTabIndex?.(activeTabIdx);
  }, [activeTabIdx]);

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

            return renderTabPanel({ fieldProps, index, elements });
          }

          // Always shows the panel without tabs when it is a template
          return (
            <FieldSet
              className={classNames(sectionId, className)}
              id={sectionId}
              legend={legend}
            >
              {renderAboveTabs?.()}
              <Tabs selectedIndex={activeTabIdx} onSelect={setActiveTabIdx}>
                {
                  // Only show the tabs when there is more than 1 element:
                  <TabList
                    className={`react-tabs__tab-list mb-0 ${
                      elements.length <= 1 ? "d-none" : ""
                    }`}
                  >
                    {elements.map((element, index) => (
                      <Tab key={index}>
                        <TabErrorIndicator index={index} name={name}>
                          {hasError => (
                            <div>
                              {renderTab(element, index)}
                              {hasError && (
                                <span className="text-danger">
                                  {" "}
                                  ({<DinaMessage id="hasError" />})
                                </span>
                              )}
                            </div>
                          )}
                        </TabErrorIndicator>
                      </Tab>
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
                                <DinaMessage
                                  id="addAnother"
                                  values={{ typeName }}
                                />
                              </FormikButton>
                              <FormikButton
                                className="list-inline-item btn btn-dark"
                                onClick={() => removeElement(index)}
                              >
                                <DinaMessage
                                  id="removeThisElement"
                                  values={{ typeName }}
                                />
                              </FormikButton>
                            </div>
                          )}
                        </div>
                      </TabPanel>
                    ))
                  : null}
              </Tabs>
              {!elements.length && !readOnly && !isTemplate && (
                <div className="d-flex">
                  <FormikButton
                    className="btn btn-primary add-button"
                    onClick={addElement}
                  >
                    <DinaMessage id="addNewElement" values={{ typeName }} />
                  </FormikButton>
                </div>
              )}
            </FieldSet>
          );
        }}
      </FieldArray>
    </div>
  );
}

function TabErrorIndicator({ name, index, children }) {
  const { errors } = useFormikContext();
  const hasError = !isEmpty(get(errors, `${name}[${index}]`));

  return children(hasError);
}
