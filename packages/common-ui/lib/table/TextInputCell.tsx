import { CellContext } from "@tanstack/react-table";
import { useEffect, useState } from "react";

export function TextInputCell<TData>({
  row: { index, original },
  column: { id: columnId },
  table
}: CellContext<TData, unknown>) {
  const initialValue = original[columnId] ?? "";
  // We need to keep and update the state of the cell normally
  const [value, setValue] = useState(initialValue);

  // When the input is blurred, we'll call our table meta's updateData function
  const onBlur = () => {
    (table.options.meta as any).updateData(index, columnId, value);
  };

  // If the initialValue is changed external, sync it up with our state
  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  return (
    <input
      style={{ width: "100%" }}
      value={value as string}
      onChange={(e) => setValue(e.target.value)}
      onBlur={onBlur}
    />
  );
}
