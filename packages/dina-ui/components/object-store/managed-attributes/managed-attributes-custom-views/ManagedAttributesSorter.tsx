import {
  FieldSpy,
  filterBy,
  FormikButton,
  ResourceSelect,
  useDinaFormContext
} from "common-ui";
import { FieldArray } from "formik";
import { get } from "lodash";
import { PropsWithChildren } from "react";
import { GiMove } from "react-icons/gi";
import { RiDeleteBinLine } from "react-icons/ri";
import {
  SortableContainer,
  SortableElement,
  SortEnd
} from "react-sortable-hoc";
import { DinaMessage, useDinaIntl } from "../../../../intl/dina-ui-intl";
import { ManagedAttribute } from "../../../../types/objectstore-api";
import { ManagedAttributeName } from "../ManagedAttributesViewer";

export interface ManagedAttributeSorterProps {
  managedAttributeComponent?: string;
  /** Field name for the managed attribute key array. */
  name: string;
}

export function ManagedAttributesSorter({
  managedAttributeComponent,
  name
}: ManagedAttributeSorterProps) {
  const { readOnly } = useDinaFormContext();
  const { formatMessage } = useDinaIntl();

  return (
    <FieldArray name={name}>
      {({ push, remove, form, move }) => {
        function onSortStart(_, event: unknown) {
          if (event instanceof MouseEvent) {
            document.body.style.cursor = "grabbing";
          }
        }
        function onSortEnd(se: SortEnd) {
          document.body.style.cursor = "inherit";
          move(se.oldIndex, se.newIndex);
        }

        const attributeKeys = (get(form.values, name) ?? []) as string[];

        return (
          <div>
            {!readOnly && (
              <div
                className="managed-attributes-select mb-4"
                style={{ maxWidth: "30rem" }}
              >
                <ResourceSelect<ManagedAttribute>
                  filter={input => ({
                    ...filterBy(["name"])(input),
                    ...(managedAttributeComponent
                      ? { managedAttributeComponent }
                      : {})
                  })}
                  model="collection-api/managed-attribute"
                  onChange={ma => {
                    if (
                      !Array.isArray(ma) &&
                      !attributeKeys.includes?.(ma.key)
                    ) {
                      push(ma.key);
                    }
                  }}
                  optionLabel={ma => ma.name}
                  placeholder={formatMessage("addManagedAttribute")}
                  omitNullOption={true}
                />
              </div>
            )}
            {!readOnly && attributeKeys.length >= 2 && (
              <div>
                <div className="alert alert-warning d-flex flex-column gap-2">
                  <div>
                    <strong>
                      <DinaMessage id="dragDropInstructionsHeader" />
                    </strong>
                  </div>
                  <div>
                    <strong>
                      <DinaMessage id="withAMouse" />:
                    </strong>{" "}
                    <DinaMessage id="dragDropMouseInstructions" />
                  </div>
                  <div>
                    <strong>
                      <DinaMessage id="withAKeyboard" />:
                    </strong>{" "}
                    <DinaMessage id="dragDropKeyboardInstructions" />
                  </div>
                </div>
              </div>
            )}
            <div>
              <FieldSpy<string[]> fieldName={name}>
                {keys => (
                  <SortableAttributesViewList
                    axis="xy"
                    onSortStart={onSortStart}
                    onSortEnd={onSortEnd}
                    // "distance" is needed to allow clicking the Remove button:
                    distance={1}
                    helperClass="sortable-lifted"
                  >
                    {/* Give the lifted drag/drop item a blue background. */}
                    <style>{`
                      .form-control.sortable-lifted {
                        background-color: rgb(222, 235, 255);
                        z-index: 1100;
                      }
                    `}</style>
                    {keys?.map((key, index) => (
                      <SortableAttributesViewItem
                        disabled={readOnly}
                        key={key}
                        attributeKey={key}
                        onRemoveClick={() => remove(index)}
                        index={index}
                        managedAttributeComponent={managedAttributeComponent}
                      />
                    ))}
                  </SortableAttributesViewList>
                )}
              </FieldSpy>
            </div>
          </div>
        );
      }}
    </FieldArray>
  );
}

function AttributesViewList({ children }: PropsWithChildren<{}>) {
  return (
    <div className="d-flex justify-content-between flex-wrap">{children}</div>
  );
}

interface AttributesViewItemProps {
  attributeKey: string;
  onRemoveClick: () => void;
  managedAttributeComponent?: string;
}

function AttributesViewItem({
  managedAttributeComponent,
  attributeKey,
  onRemoveClick
}: AttributesViewItemProps) {
  const { readOnly } = useDinaFormContext();
  const cursor = readOnly ? undefined : "grab";

  return (
    <div
      // form-control adds the blue focus ring around the div:
      className="card card-body mb-4 form-control"
      style={{
        cursor,
        maxWidth: "49.2%"
      }}
      // Makes the div focusable and keyboard navigatable:
      tabIndex={readOnly ? undefined : 0}
    >
      <label htmlFor="none" style={{ cursor }}>
        <div className="mb-2 d-flex align-items-center">
          <div className="me-auto">
            <strong>
              {managedAttributeComponent ? (
                <ManagedAttributeName
                  managedAttributeKey={attributeKey}
                  managedAttributeApiPath={key =>
                    `collection-api/managed-attribute/${managedAttributeComponent}.${key}`
                  }
                />
              ) : null}
            </strong>
          </div>
          {!readOnly && (
            <div className="d-flex align-items-center gap-2">
              <FormikButton
                className="btn remove-attribute"
                onClick={() => onRemoveClick()}
              >
                <RiDeleteBinLine size="1.8em" />
              </FormikButton>
              <GiMove size="1.8em" />
            </div>
          )}
        </div>
        <input type="text" className="form-control" disabled={true} />
      </label>
    </div>
  );
}

const SortableAttributesViewItem = SortableElement(AttributesViewItem);
export const SortableAttributesViewList = SortableContainer(AttributesViewList);
