import { FieldWrapperProps, FormikButton, Tooltip } from "common-ui";
import { ReactNode } from "react";
import { FaMinus, FaPlus } from "react-icons/fa";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";
import { ArrayFieldContainer } from "./ArrayFieldContainer";

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
 * Renders an array of objects as stacked rows, each with its own remove button.
 * Use when seeing every element at once matters more than saving vertical space;
 * otherwise see TabbedArrayField.
 */
export function InlineArrayField<T>({
  className,
  sectionId,
  typeName,
  name,
  legend,
  makeNewElement,
  renderRow,
  removePadding
}: InlineArrayFieldProps<T>) {
  const { formatMessage } = useDinaIntl();

  return (
    <ArrayFieldContainer<T>
      className={className}
      sectionId={sectionId}
      name={name}
      legend={legend}
      makeNewElement={makeNewElement}
      removePadding={removePadding}
    >
      {({
        elements,
        fieldProps,
        addElement,
        removeElement,
        readOnly,
        isTemplate
      }) => {
        // Nothing to show in read-only mode when the array is empty:
        if (readOnly && !elements.length) {
          return null;
        }

        const showControls = !readOnly && !isTemplate;

        return (
          <>
            {/* Prevent stale values in the inputs after removing an element: */}
            <div key={elements.length}>
              {elements.map((_element, index) => (
                <div
                  className={index ? "mt-3 pt-3 border-top" : undefined}
                  key={index}
                >
                  <div className="d-flex align-items-start gap-2">
                    <div className="flex-grow-1">
                      {renderRow({
                        elements,
                        index,
                        fieldProps: fieldProps(index)
                      })}
                    </div>
                    {showControls && (
                      <div>
                        {/* Mirrors FieldWrapper's label block so the button
                        lines up with the inputs on the row's first line. */}
                        <div className="field-label mb-2" aria-hidden="true">
                          <div className="d-flex align-items-center w-100">
                            <strong className="me-2">&nbsp;</strong>
                          </div>
                        </div>
                        <div className="d-inline-flex">
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
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {showControls && (
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
          </>
        );
      }}
    </ArrayFieldContainer>
  );
}
