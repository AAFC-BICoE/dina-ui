import classNames from "classnames";
import {
  FieldSet,
  FieldWrapperProps,
  FormikButton,
  Tooltip,
  useDinaFormContext
} from "common-ui";
import { FieldArray } from "formik";
import { ReactNode } from "react";
import { FaMinus, FaPlus } from "react-icons/fa";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";

export interface InlineArrayFieldProps<T> {
  className?: string;
  sectionId: string;
  typeName: string;
  name: string;
  legend?: React.JSX.Element;
  makeNewElement: (elements: T[]) => T;
  renderRow: (rowCtx: InlineRowCtx<T>) => ReactNode;

  /** Remove the padding and border around the fieldset. */
  removePadding?: boolean;
}

export interface InlineRowCtx<T> {
  /** Prefixed field name props for nesting inside an array field. */
  fieldProps: (fieldName: string) => FieldWrapperProps;
  /** Array element index. */
  index: number;

  elements: T[];
}

/**
 * Renders an array of objects as stacked rows, each with its own remove button,
 * and an add button underneath. An alternative to TabbedArrayField for arrays
 * where seeing every element at once matters more than saving vertical space.
 */
export function InlineArrayField<T>({
  className,
  name,
  typeName,
  makeNewElement,
  sectionId,
  legend,
  removePadding,
  renderRow
}: InlineArrayFieldProps<T>) {
  const { readOnly, isTemplate } = useDinaFormContext();
  const { formatMessage } = useDinaIntl();

  return (
    <FieldArray name={name}>
      {(fieldArrayProps) => {
        const elements = (fieldArrayProps.form.getFieldMeta(name).value ||
          []) as T[];

        function addElement() {
          fieldArrayProps.push(makeNewElement(elements));
        }

        function removeElement(index: number) {
          fieldArrayProps.remove(index);
        }

        function rowInternal(index: number) {
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

          return renderRow({ fieldProps, index, elements });
        }

        // Nothing to show in read-only mode when the array is empty:
        if (readOnly && !elements.length) {
          return null;
        }

        return (
          <FieldSet
            className={classNames(sectionId, className)}
            id={sectionId}
            legend={legend}
            fieldName={name}
            removePadding={removePadding}
          >
            {/* Prevent stale values in the inputs after removing an element: */}
            <div key={elements.length}>
              {elements.map((_element, index) => (
                <div
                  className={index ? "mt-3 pt-3 border-top" : undefined}
                  key={index}
                >
                  <div className="d-flex align-items-start gap-2">
                    <div className="flex-grow-1">{rowInternal(index)}</div>
                    {!readOnly && !isTemplate && (
                      <div className="d-inline-flex mt-4">
                        <FormikButton
                          className="btn btn-dark remove-row-button"
                          onClick={() => removeElement(index)}
                        >
                          <div data-testid="remove-this-button">
                            <FaMinus />
                          </div>
                        </FormikButton>
                        <Tooltip
                          directText={formatMessage("removeThisElement", {
                            typeName
                          })}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {!readOnly && !isTemplate && (
              <div className="d-flex mt-3">
                {elements.length ? (
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
                      directText={formatMessage("addAnother", { typeName })}
                    />
                  </div>
                ) : (
                  <FormikButton
                    className="btn btn-primary mb-2 add-button"
                    onClick={addElement}
                  >
                    <DinaMessage id="addNewElement" values={{ typeName }} />
                  </FormikButton>
                )}
              </div>
            )}
          </FieldSet>
        );
      }}
    </FieldArray>
  );
}
