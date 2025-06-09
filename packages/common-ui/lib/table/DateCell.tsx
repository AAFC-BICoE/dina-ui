import { DateView } from "../date/DateView";
import _ from "lodash";
import { TableColumn } from "../list-page/types";
import { FieldHeader } from "../field-header/FieldHeader";
import { KitsuResource } from "kitsu";

/** Renders a date cell into a table in a user-friendly / readable format. */
export function dateCell<TData extends KitsuResource>(
  label: string,
  accessorKey?: string,
  relationshipType?: string,
  isColumnVisible?: boolean,
  queryOption?: any
): TableColumn<TData> {
  return {
    cell: ({ row: { original } }) => {
      let value = _.get(original, accessorKey ?? label);
      if (relationshipType) {
        const relationshipAccessor = accessorKey?.split(".");
        relationshipAccessor?.splice(1, 0, relationshipType);
        const relationshipAccessorKey = relationshipAccessor?.join(".");
        value = _.get(original, relationshipAccessorKey ?? label);
      }
      return <DateView date={value} />;
    },
    header: () => <FieldHeader name={label} />,
    isKeyword: false,
    accessorKey: accessorKey ?? label,
    id: label,
    relationshipType,
    isColumnVisible,
    queryOption
  };
}
