import { get } from "lodash";
import { TableColumn8 } from "../list-page/types";
import { FieldHeader } from "../field-header/FieldHeader";

/** Renders a string array cell into a table in comma separated format. */
export function stringArrayCell8<TData>(
  label: string,
  accessorKey?: string
): TableColumn8<TData> {
  return {
    id: "stringArrayCol_" + label,
    cell: ({ row: { original } }) => {
      const value = get(original, accessorKey ?? label);
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
