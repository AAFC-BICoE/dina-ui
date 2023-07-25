import { DateView } from "../date/DateView";
import { get } from "lodash";
import { TableColumn8 } from "../list-page/types";
import { FieldHeader } from "../field-header/FieldHeader";
import { KitsuResource } from "kitsu";

/** Renders a date cell into a table in a user-friendly / readable format. */
export function dateCell<TData extends KitsuResource>(
  label: string,
  accessorKey?: string
): TableColumn8<TData> {
  return {
    cell: ({ row: { original } }) => {
      const value = get(original, accessorKey ?? label);
      return <DateView date={value} />;
    },
    header: () => <FieldHeader name={label} />,
    isKeyword: false,
    accessorKey: accessorKey ?? label,
    id: label
  };
}
