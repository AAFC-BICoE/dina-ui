import { DndContext, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  rectSortingStrategy
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { castArray } from "lodash";
import { useState } from "react";
import Select, { ActionMeta, Props as SelectProps } from "react-select";

export interface SortableSelectProps<Option, IsMulti extends boolean>
  extends Omit<SelectProps<Option, IsMulti>, "onChange"> {
  onChange?: (
    value: null | Option | Option[],
    actionMeta?: ActionMeta<Option>
  ) => void;
}

export function SortableSelect<
  Option extends { value: string; label: string },
  IsMulti extends boolean
>({
  isMulti,
  value,
  onChange: onChangeProp,
  ...props
}: SortableSelectProps<Option, IsMulti>) {
  const [selectedValues, setSelectedValues] = useState(
    !value ? [] : castArray(value)
  );
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

  function handleOnChange(newSelectedRaw) {
    if (isMulti) {
      setSelectedValues(
        newSelectedRaw
          ? Array.isArray(newSelectedRaw)
            ? newSelectedRaw
            : []
          : []
      );
      onChangeProp?.(newSelectedRaw);
    } else {
      setSelectedValues(newSelectedRaw ? [newSelectedRaw as Option] : []);
      onChangeProp?.(newSelectedRaw as Option | null);
    }
  }

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
          <Select<Option, IsMulti>
            isMulti={isMulti}
            value={selectedValues}
            onChange={handleOnChange}
            {...props}
            components={{
              MultiValue: MultiValue
            }}
          />
        </SortableContext>
      </DndContext>
    );
  } else {
    return (
      <Select<Option, IsMulti>
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
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({
      id: data.value // Unique ID!
    });

  return (
    <div
      ref={setNodeRef}
      style={{
        ...removeProps.style,
        transform: CSS.Transform.toString(transform),
        transition,
        display: "inline-flex",
        alignItems: "center",
        marginRight: "4px",
        padding: "4px 6px",
        borderRadius: "2px",
        backgroundColor: "#e6e6e6",
        cursor: "move",
        fontSize: "85%"
      }}
      {...attributes}
      {...listeners}
    >
      {children}
      <span {...removeProps} style={{ marginLeft: "6px", cursor: "pointer" }}>
        &times;
      </span>{" "}
    </div>
  );
};
