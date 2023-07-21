import { Column } from "@tanstack/react-table";
import { DebouncedInput } from "./DebouncedInput";

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
