import {
  DinaFormSection,
  FieldSpy,
  FormikButton,
  ResourceSelect,
  SimpleSearchFilterBuilder,
  useDinaFormContext
} from "common-ui";
import { FieldArray } from "formik";
import { PersistedResource } from "kitsu";
import _ from "lodash";
import { useRef } from "react";
import { GiMove } from "react-icons/gi";
import { RiDeleteBinLine } from "react-icons/ri";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import {
  ControlledVocabularyItem,
  ManagedAttribute
} from "../../../types/collection-api";
import { ManagedAttributeField } from "../ManagedAttributeField";
import { useManagedAttributeQueries } from "../useManagedAttributeQueries";
import { COLLECTION_MANAGED_ATTRIBUTE_ID } from "../../controlled-vocabulary/controlledVocabularyItemUtils";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export interface ManagedAttributeSorterProps {
  managedAttributeComponent?: string;
  /** Field name for the managed attribute key array. */
  name: string;
  /** If inputa are editable, this is the path to the managedAttributes field in the form. */
  valuesPath?: string;
  managedAttributeApiPath: string;

  /**
   * Whether the managed attributes are from a controlled vocabulary endpoint (e.g. collection-api/controlled-vocabulary-item) or from a regular managed attribute endpoint (e.g. collection-api/managed-attribute).
   * This changes how the "Add Managed Attribute" selector filters and fetches attributes.
   */
  isControlledVocabulary?: boolean;

  /**
   * Controlled Vocabulary UUID used to scope managed attributes when isControlledVocabulary is true.
   * Defaults to the collection managed attribute vocabulary.
   */
  controlledVocabularyId?: string;
}

export function ManagedAttributesSorter({
  managedAttributeComponent,
  name,
  managedAttributeApiPath,
  valuesPath,
  isControlledVocabulary = false,
  controlledVocabularyId = COLLECTION_MANAGED_ATTRIBUTE_ID
}: ManagedAttributeSorterProps) {
  const { readOnly, isTemplate } = useDinaFormContext();
  const { formatMessage, locale } = useDinaIntl();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 1
      }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  return (
    <FieldArray name={name}>
      {({ push, remove, form, move }) => {
        function handleDragStart() {
          document.body.style.cursor = "grabbing";
        }

        function handleDragEnd(event) {
          document.body.style.cursor = "inherit";
          const { active, over } = event;

          if (active.id !== over?.id) {
            const attributeKeys = (_.get(form.values, name) ?? []) as string[];
            const oldIndex = attributeKeys.indexOf(active.id);
            const newIndex = attributeKeys.indexOf(over.id);

            if (oldIndex !== -1 && newIndex !== -1) {
              move(oldIndex, newIndex);
            }
          }
        }

        const attributeKeys = (_.get(form.values, name) ?? []) as string[];

        return (
          <div>
            {!readOnly && (
              <div
                className="managed-attributes-select mb-4"
                style={{ maxWidth: "30rem" }}
              >
                <ResourceSelect<ManagedAttribute | ControlledVocabularyItem>
                  filter={(input: string) =>
                    SimpleSearchFilterBuilder.create<any>()
                      .searchFilter("name", input)
                      .when(!!managedAttributeComponent, (builder) =>
                        builder.where(
                          isControlledVocabulary
                            ? "dinaComponent"
                            : "managedAttributeComponent",
                          "EQ",
                          managedAttributeComponent
                        )
                      )
                      .when(isControlledVocabulary, (builder) =>
                        builder.where(
                          "controlledVocabulary.uuid",
                          "EQ",
                          controlledVocabularyId
                        )
                      )
                      .build()
                  }
                  model={managedAttributeApiPath}
                  onChange={(ma) => {
                    if (
                      ma != null &&
                      !Array.isArray(ma) &&
                      !attributeKeys.includes?.(ma.key)
                    ) {
                      push(ma.key);
                    }
                  }}
                  optionLabel={(attribute) => {
                    const localizedTitle = (
                      attribute as ControlledVocabularyItem
                    )?.multilingualTitle?.titles?.find(
                      (t) => t.lang === locale
                    )?.title;
                    const fallbackTitle = (
                      attribute as ControlledVocabularyItem
                    )?.multilingualTitle?.titles?.find(
                      (t) => t.lang !== locale
                    )?.title;
                    return (
                      localizedTitle || fallbackTitle || attribute.name || ""
                    );
                  }}
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
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                  >
                    <AttributesViewList
                      keys={keys ?? []}
                      managedAttributeApiPath={managedAttributeApiPath}
                      managedAttributeComponent={managedAttributeComponent}
                      onRemoveClick={(index) => remove(index)}
                      valuesPath={valuesPath}
                      isControlledVocabulary={isControlledVocabulary}
                      controlledVocabularyId={controlledVocabularyId}
                    />
                  </DndContext>
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
  isControlledVocabulary?: boolean;
  controlledVocabularyId?: string;
}

/** Sortable Managed Attribute list. */
function AttributesViewList({
  keys,
  managedAttributeApiPath,
  managedAttributeComponent,
  onRemoveClick,
  valuesPath,
  isControlledVocabulary = false,
  controlledVocabularyId = COLLECTION_MANAGED_ATTRIBUTE_ID
}: AttributesViewListProps) {
  // Fetch the attributes, but omit any that are missing e.g. were deleted.
  const { data: fetchedAttributes } = useManagedAttributeQueries({
    keys,
    managedAttributeApiPath,
    managedAttributeComponent,
    disabled: !keys.length,
    isControlledVocabulary,
    controlledVocabularyId
  });

  // Store the last fetched Attributes in a ref instead of showing a
  // loading state when the visible attributes change.
  const lastFetchedAttributes = useRef<
    PersistedResource<ManagedAttribute | ControlledVocabularyItem>[]
  >([]);
  if (fetchedAttributes) {
    lastFetchedAttributes.current = _.compact(fetchedAttributes);
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
        .sortable-managed-attribute.dragging {
          background-color: rgb(222, 235, 255);
          z-index: 1100;
        }
      `}</style>
      <DinaFormSection isTemplate={false}>
        <SortableContext
          items={visibleAttributes.map((attr) => attr.key)}
          strategy={verticalListSortingStrategy}
        >
          {visibleAttributes.map((attribute, index) => (
            <SortableAttributesViewItem
              key={attribute.key}
              onRemoveClick={() => onRemoveClick(index)}
              attribute={attribute}
              valuesPath={valuesPath}
            />
          ))}
        </SortableContext>
      </DinaFormSection>
    </div>
  );
}

interface AttributesViewItemProps {
  onRemoveClick: () => void;
  attribute: PersistedResource<ManagedAttribute | ControlledVocabularyItem>;
  valuesPath?: string;
}

function SortableAttributesViewItem({
  onRemoveClick,
  attribute,
  valuesPath
}: AttributesViewItemProps) {
  const { readOnly } = useDinaFormContext();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: attribute.key,
    disabled: readOnly
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    maxWidth: "49.2%"
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      // form-control adds the blue focus ring around the div:
      className={`card card-body mb-4 form-control sortable-managed-attribute ${
        isDragging ? "dragging" : ""
      }`}
      // Makes the div focusable and keyboard navigatable:
      tabIndex={readOnly ? undefined : 0}
    >
      <label htmlFor="none">
        <div className="mb-2 d-flex align-items-center">
          <div className="me-auto">
            <strong>{attribute.name}</strong>
          </div>
          {!readOnly && (
            <div className="d-flex align-items-center gap-2">
              <div
                {...attributes}
                {...listeners}
                style={{
                  cursor: "grab",
                  display: "flex",
                  alignItems: "center",
                  padding: "4px",
                  borderRadius: "4px"
                }}
                title="Drag to reorder"
              >
                <GiMove size="1.8em" />
              </div>
              <FormikButton
                className="btn remove-attribute"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveClick();
                }}
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
