import { DndContext, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  rectSortingStrategy
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import _ from "lodash";
import { useEffect, useState } from "react";
import Select, {
  ActionMeta,
  Props as SelectProps,
  GroupBase
} from "react-select";
import CreatableSelect, { CreatableProps } from "react-select/creatable";

export interface SortableSelectProps<
  Option,
  IsMulti extends boolean,
  Group extends GroupBase<Option>
> extends Omit<
    SelectProps<Option, IsMulti, Group> &
      CreatableProps<Option, IsMulti, Group>,
    "onChange"
  > {
  onChange?: (
    value: null | Option | Option[],
    actionMeta?: ActionMeta<Option>
  ) => void;

  /**
   * Whether to use CreatableSelect instead of regular Select.
   */
  isCreatable?: boolean;
}

export function SortableSelect<
  Option extends { value: string; label: string },
  IsMulti extends boolean = false,
  Group extends GroupBase<Option> = GroupBase<Option>
>({
  isMulti,
  value,
  onChange: onChangeProp,
  isCreatable = false,
  ...props
}: SortableSelectProps<Option, IsMulti, Group>) {
  const [selectedValues, setSelectedValues] = useState(
    !value ? [] : _.castArray(value)
  );

  // Sync internal state with external value changes
  useEffect(() => {
    const newValues = !value ? [] : _.castArray(value);
    setSelectedValues(newValues);
  }, [value]);

  // Handle sorting logic only for multi-select mode
  const handleOnDragEnd = (event: any) => {
    const { active, over } = event;
    if (
      !isMulti ||
      !Array.isArray(value) ||
      !active ||
      !over ||
      active.id === over.id
    ) {
      return;
    }
    const oldIndex = selectedValues.findIndex((it) => it.value === active.id);
    const newIndex = selectedValues.findIndex((it) => it.value === over.id);
    const newSelectedValues = arrayMove(selectedValues, oldIndex, newIndex);

    setSelectedValues(newSelectedValues);

    onChangeProp?.(newSelectedValues);
  };

  function handleOnChange(newSelectedRaw, actionMeta?: ActionMeta<Option>) {
    if (isMulti) {
      setSelectedValues(
        newSelectedRaw
          ? Array.isArray(newSelectedRaw)
            ? newSelectedRaw
            : []
          : []
      );
      onChangeProp?.(newSelectedRaw, actionMeta);
    } else {
      setSelectedValues(newSelectedRaw ? [newSelectedRaw as Option] : []);
      onChangeProp?.(newSelectedRaw as Option | null, actionMeta);
    }
  }

  // Choose the appropriate Select component based on isCreatable prop.
  const SelectComponent = isCreatable ? CreatableSelect : Select;

  if (isMulti) {
    return (
      <DndContext
        collisionDetection={closestCenter}
        onDragEnd={handleOnDragEnd}
      >
        <SortableContext
          items={selectedValues.map((opt) => opt.value)}
          strategy={rectSortingStrategy}
        >
          <SelectComponent<Option, IsMulti, Group>
            isMulti={isMulti}
            value={selectedValues}
            onChange={handleOnChange}
            {...props}
            components={{
              MultiValue: MultiValue,
              ...props.components
            }}
          />
        </SortableContext>
      </DndContext>
    );
  } else {
    return (
      <SelectComponent<Option, IsMulti, Group>
        isMulti={isMulti}
        value={selectedValues.length > 0 ? selectedValues[0] : null}
        onChange={handleOnChange}
        {...props}
      />
    );
  }
}

// Sortable item component
const MultiValue = ({ children, data, removeProps }) => {
  const [isHovered, setIsHovered] = useState(false);

  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({
      id: data.value
    });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        display: "inline-flex",
        alignItems: "center",
        marginRight: "4px",
        padding: "4px 6px",
        borderRadius: "2px",
        backgroundColor: "#e6e6e6",
        fontSize: "85%"
      }}
    >
      {/* Draggable content area with the text */}
      <div
        style={{
          cursor: "move",
          display: "flex",
          alignItems: "center"
        }}
        {...attributes}
        {...listeners}
      >
        {children}
      </div>

      {/* Remove button */}
      <span
        {...removeProps}
        role="button"
        aria-label={`Remove ${data.label}`}
        tabIndex={0}
        style={{
          marginLeft: "4px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "16px",
          height: "16px",
          borderRadius: "2px",
          backgroundColor: isHovered ? "#dc3545" : "rgba(0,0,0,0.1)",
          color: isHovered ? "white" : "inherit",
          fontSize: "12px",
          lineHeight: "1",
          transition: "background-color 0.2s ease, color 0.2s ease"
        }}
        onMouseDown={(e) => {
          // Dragging should not occur when on the remove button.
          e.stopPropagation();
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            removeProps.onClick?.(e);
          }
        }}
      >
        &times;
      </span>
    </div>
  );
};
