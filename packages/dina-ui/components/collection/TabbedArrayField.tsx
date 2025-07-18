import classNames from "classnames";
import {
  FieldSet,
  FieldWrapperProps,
  FormikButton,
  Tooltip,
  useDinaFormContext
} from "common-ui";
import { FieldArray, useFormikContext } from "formik";
import _ from "lodash";
import { ReactNode, useEffect, useState } from "react";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";
import { FaMinus, FaPlus } from "react-icons/fa";

export interface TabbedArrayFieldProps<T> {
  className?: string;
  sectionId: string;
  typeName: string;
  initialIndex?: number;
  name: string;
  legend?: JSX.Element;
  onChangeTabIndex?: (newIndex: number) => void;
  makeNewElement: (elements: T[]) => T;
  renderTabPanel: (panelCtx: TabPanelCtx<T>) => ReactNode;
  renderTab: (element: T, index: number) => ReactNode;
  renderAboveTabs?: () => ReactNode;
  wrapContent?: (content: ReactNode) => ReactNode;

  /** Remove the padding and border around the fieldset. */
  removePadding?: boolean;
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
  removePadding,
  onChangeTabIndex,
  renderTabPanel,
  renderTab,
  renderAboveTabs,
  wrapContent = (content) => content
}: TabbedArrayFieldProps<T>) {
  const { readOnly, isTemplate } = useDinaFormContext();

  const [activeTabIdx, setActiveTabIdx] = useState(initialIndex);
  const { formatMessage } = useDinaIntl();

  useEffect(() => {
    onChangeTabIndex?.(activeTabIdx);
  }, [activeTabIdx]);

  return (
    <FieldArray name={name}>
      {(fieldArrayProps) => {
        const elements = (fieldArrayProps.form.getFieldMeta(name).value ||
          []) as T[];

        function addElement() {
          fieldArrayProps.push(makeNewElement(elements));
          setActiveTabIdx(elements.length);
        }

        function removeElement(index: number) {
          fieldArrayProps.remove(index); // Stay on the current tab number, or reduce if removeing the last element:
          setActiveTabIdx((current) =>
            _.clamp(current, 0, elements.length - 2)
          );
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

        // Only show the tabs when there is more than 1 element:
        const showTabs = elements.length > 1;

        // Always shows the panel without tabs when it is a template
        return (
          <FieldSet
            className={classNames(sectionId, className)}
            id={sectionId}
            legend={legend}
            fieldName={name}
            removePadding={removePadding}
          >
            {wrapContent(
              <>
                {renderAboveTabs?.()}
                <Tabs
                  selectedIndex={activeTabIdx}
                  onSelect={setActiveTabIdx}
                  // Prevent bug where old values are shown in inputs after removing an element:
                  key={elements.length}
                >
                  {
                    <TabList
                      className={`react-tabs__tab-list mb-0 ${
                        showTabs ? "" : "d-none"
                      }`}
                    >
                      {elements.map((element, index) => (
                        <Tab key={index}>
                          {showTabs ? (
                            <TabErrorIndicator index={index} name={name}>
                              {(hasError) => (
                                <div>
                                  {renderTab(element, index)}
                                  {hasError && (
                                    <span className="text-danger is-invalid">
                                      {" "}
                                      ({<DinaMessage id="hasError" />})
                                    </span>
                                  )}
                                </div>
                              )}
                            </TabErrorIndicator>
                          ) : null}
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
                              <div className="list-inline d-flex align-items-center gap-2">
                                <div className="d-inline-flex">
                                  <FormikButton
                                    className="btn btn-primary add-button"
                                    onClick={addElement}
                                  >
                                    <div data-testid="add-another-button">
                                      <FaPlus />
                                    </div>
                                  </FormikButton>
                                  <Tooltip
                                    directText={formatMessage("addAnother", {
                                      typeName
                                    })}
                                  />
                                </div>
                                {elements.length >= 1 && (
                                  <div className="d-inline-flex">
                                    <FormikButton
                                      className="btn btn-dark"
                                      onClick={() => removeElement(index)}
                                    >
                                      <div data-testid="remove-this-button">
                                        <FaMinus />
                                      </div>
                                    </FormikButton>
                                    <Tooltip
                                      directText={formatMessage(
                                        "removeThisElement",
                                        {
                                          typeName
                                        }
                                      )}
                                    />
                                  </div>
                                )}
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
                      className="btn btn-primary mb-2 add-button"
                      onClick={addElement}
                    >
                      <DinaMessage id="addNewElement" values={{ typeName }} />
                    </FormikButton>
                  </div>
                )}
              </>
            )}
          </FieldSet>
        );
      }}
    </FieldArray>
  );
}

function TabErrorIndicator({ name, index, children }) {
  const { errors } = useFormikContext();
  const hasError = !_.isEmpty(_.get(errors, `${name}[${index}]`));

  return children(hasError);
}
