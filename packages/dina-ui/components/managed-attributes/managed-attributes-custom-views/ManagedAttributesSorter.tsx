import {
  DinaFormSection,
  FieldSpy,
  filterBy,
  FormikButton,
  ResourceSelect,
  useBulkGet,
  useDinaFormContext
} from "common-ui";
import { FieldArray } from "formik";
import { PersistedResource } from "kitsu";
import { compact, get } from "lodash";
import { useRef } from "react";
import { GiMove } from "react-icons/gi";
import { RiDeleteBinLine } from "react-icons/ri";
import {
  SortableContainer,
  SortableElement,
  SortEnd
} from "react-sortable-hoc";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { ManagedAttribute } from "../../../../dina-ui/types/collection-api";
import { ManagedAttributeField } from "../ManagedAttributeField";

export interface ManagedAttributeSorterProps {
  managedAttributeComponent?: string;
  /** Field name for the managed attribute key array. */
  name: string;
  /** If inputa are editable, this is the path to the managedAttributes field in the form. */
  valuesPath?: string;
  managedAttributeApiPath: string;
}

export function ManagedAttributesSorter({
  managedAttributeComponent,
  name,
  managedAttributeApiPath,
  valuesPath
}: ManagedAttributeSorterProps) {
  const { readOnly, isTemplate } = useDinaFormContext();
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
                  filter={(input) => ({
                    ...filterBy(["name"])(input),
                    ...(managedAttributeComponent
                      ? { managedAttributeComponent }
                      : {})
                  })}
                  model={managedAttributeApiPath}
                  onChange={(ma) => {
                    if (
                      !Array.isArray(ma) &&
                      !attributeKeys.includes?.(ma.key)
                    ) {
                      push(ma.key);
                    }
                  }}
                  optionLabel={(ma) => ma.name}
                  placeholder={formatMessage("addManagedAttribute")}
                  omitNullOption={true}
                />
              </div>
            )}
            {isTemplate && (
              <div className="alert alert-warning">
                <DinaMessage id="managedAttributeTemplateOrderInfo" />
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
                {(keys) => (
                  <SortableAttributesViewList
                    axis="xy"
                    onSortStart={onSortStart}
                    onSortEnd={onSortEnd}
                    // "distance" is needed to allow clicking the Remove button:
                    distance={1}
                    helperClass="sortable-lifted"
                    keys={keys ?? []}
                    managedAttributeApiPath={managedAttributeApiPath}
                    managedAttributeComponent={managedAttributeComponent}
                    onRemoveClick={(index) => remove(index)}
                    valuesPath={valuesPath}
                  />
                )}
              </FieldSpy>
            </div>
          </div>
        );
      }}
    </FieldArray>
  );
}

interface AttributesViewListProps {
  keys: string[];
  managedAttributeApiPath: string;
  managedAttributeComponent?: string;
  onRemoveClick: (index: number) => void;
  valuesPath?: string;
}

/** Sortable Managed Attribute list. */
function AttributesViewList({
  keys,
  managedAttributeApiPath,
  managedAttributeComponent,
  onRemoveClick,
  valuesPath
}: AttributesViewListProps) {
  const { readOnly } = useDinaFormContext();

  // Fetch the attributes, but omit any that are missing e.g. were deleted.
  const { dataWithNullForMissing: fetchedAttributes, loading } =
    useBulkGet<ManagedAttribute>({
      ids: keys.map((key) =>
        // Use the component prefix if needed by the back-end:
        compact([managedAttributeComponent, key]).join(".")
      ),
      listPath: managedAttributeApiPath
    });

  // Store the last fetched Attributes in a ref instead of showing a
  // loading state when the visible attributes change.
  const lastFetchedAttributes = useRef<PersistedResource<ManagedAttribute>[]>(
    []
  );
  if (fetchedAttributes) {
    lastFetchedAttributes.current = compact(fetchedAttributes);
  }

  const visibleAttributes = lastFetchedAttributes.current;

  return (
    <div className="d-flex justify-content-between flex-wrap">
      {/* Give the lifted drag/drop item a blue background. */}
      <style>{`
        .form-control.sortable-lifted {
          background-color: rgb(222, 235, 255);
          z-index: 1100;
        }
      `}</style>
      <DinaFormSection isTemplate={false}>
        {visibleAttributes.map((attribute, index) => (
          <SortableAttributesViewItem
            disabled={readOnly}
            key={attribute.key}
            onRemoveClick={() => onRemoveClick(index)}
            index={index}
            attribute={attribute}
            valuesPath={valuesPath}
          />
        ))}
      </DinaFormSection>
    </div>
  );
}

interface AttributesViewItemProps {
  onRemoveClick: () => void;
  attribute: PersistedResource<ManagedAttribute>;
  valuesPath?: string;
}

function AttributesViewItem({
  onRemoveClick,
  attribute,
  valuesPath
}: AttributesViewItemProps) {
  const { readOnly } = useDinaFormContext();
  const cursor = readOnly ? undefined : "grab";

  return (
    <div
      // form-control adds the blue focus ring around the div:
      className="card card-body mb-4 form-control sortable-managed-attribute"
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
            <strong>{attribute.name}</strong>
          </div>
          {!readOnly && (
            <div className="d-flex align-items-center gap-2">
              <GiMove size="1.8em" />
              <FormikButton
                className="btn remove-attribute"
                onClick={() => onRemoveClick()}
              >
                <RiDeleteBinLine size="1.8em" />
              </FormikButton>
            </div>
          )}
        </div>
        {
          // If a valuesPath is provided e.g. "managedAttributes", allow editing the inputs.
          // This can be used for setting default values in a form template editor.
          valuesPath ? (
            <ManagedAttributeField
              attribute={attribute}
              valuesPath={valuesPath}
            />
          ) : (
            <input type="text" className="form-control" disabled={true} />
          )
        }
      </label>
    </div>
  );
}

const SortableAttributesViewItem = SortableElement(AttributesViewItem);
export const SortableAttributesViewList = SortableContainer(AttributesViewList);
