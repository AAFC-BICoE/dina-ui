import _ from "lodash";
import { TableColumn } from "../list-page/types";
import { FieldHeader } from "../field-header/FieldHeader";
import { KitsuResource } from "kitsu";

/** Renders a string array cell into a table in comma separated format. */
export function stringArrayCell<TData extends KitsuResource>(
  label: string,
  accessorKey?: string
): TableColumn<TData> {
  return {
    id: label,
    cell: ({ row: { original } }) => {
      const value = _.get(original, accessorKey ?? label);
      if (value) {
        const joinedString = value.join(", ");
        return <div className="stringArray-cell">{joinedString}</div>;
      }
      return null;
    },
    header: () => <FieldHeader name={label} />,
    isKeyword: true,
    accessorKey: accessorKey ?? label
  };
}
