import { Column, Table } from "@tanstack/react-table";
import { useMemo } from "react";
import { DebouncedInput } from "./debounced-input";

export function FilterInput({ column }: { column: Column<any, unknown> }) {
  const columnFilterValue = column.getFilterValue();

  return (
    <DebouncedInput
      type="text"
      value={(columnFilterValue ?? "") as string}
      onChange={(value) => column.setFilterValue(value)}
      placeholder={`Search...`}
      className="w-100 border shadow rounded"
    />
  );
}
