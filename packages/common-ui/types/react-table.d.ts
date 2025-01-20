/* eslint-disable @typescript-eslint/no-unused-vars */
import "@tanstack/react-table";

declare module "@tanstack/table-core" {
  interface ColumnMeta<TData extends RowData, TValue> {
    className?: string;
    style?: CSSProperties;
  }

  interface TableMeta<TData extends RowData> {
    updateData?: (rowIndex: number, columnId: string, value: unknown) => void;
    enableEditing?: boolean;
  }
}
