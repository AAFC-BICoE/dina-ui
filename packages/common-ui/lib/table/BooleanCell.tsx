import _ from "lodash";
import { FaCheckSquare, FaRegSquare } from "react-icons/fa";
import { FieldHeader } from "../field-header/FieldHeader";
import { KitsuResource } from "kitsu";
import { TableColumn } from "../list-page/types";

/**
 * Helper cell function to display boolean values in tables. It will display a checkbox icon that
 * changes depending on if it's true/false.
 *
 * Null/undefined values will be displayed as an empty string.
 *
 * @param label Column header to be used.
 * @param accessorKey Accessor for elastic search.
 * @returns The cell to be displayed.
 */
export function booleanCell<TData extends KitsuResource>(
  label: string,
  accessorKey?: string
): TableColumn<TData> {
  return {
    id: label,
    cell: ({ row: { original } }) => {
      const booleanValue = _.get(original, accessorKey ?? label)?.toString();
      if (booleanValue === "true") {
        return <FaCheckSquare />;
      } else if (booleanValue === "false") {
        return <FaRegSquare />;
      } else {
        return <></>;
      }
    },
    header: () => <FieldHeader name={label} />,
    isKeyword: false,
    accessorKey: accessorKey ?? label
  };
}
